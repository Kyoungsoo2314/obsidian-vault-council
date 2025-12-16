import { ItemView, WorkspaceLeaf, TFile, TFolder, MarkdownView, Notice } from 'obsidian';
import VaultCouncilPlugin from '../../main';
import { Message, ModelResponse } from '../types/types';
import { OpenRouterService } from '../services/OpenRouterService';
import { SaveManager } from '../vault/SaveManager';

export const VIEW_TYPE_COUNCIL = 'vault-council-view';

export class CouncilView extends ItemView {
	plugin: VaultCouncilPlugin;
	messages: Message[] = [];
	conversationEl: HTMLElement;
	contextEl: HTMLElement;
	inputEl: HTMLTextAreaElement;
	conversationStartTime: number = Date.now();
	linkedFilesContext: string[] = [];
	modelsUsedInSession: Set<string> = new Set();
	hadChairmanSynthesis: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: VaultCouncilPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_COUNCIL;
	}

	getDisplayText(): string {
		return 'Vault Council';
	}

	getIcon(): string {
		return 'bot';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('vault-council-container');

		// Create header
		const header = container.createEl('div', { cls: 'vault-council-header' });
		const titleRow = header.createEl('div', { cls: 'vault-council-title-row' });
		titleRow.createEl('h4', { text: 'Vault Council', cls: 'vault-council-title' });

		// Vault switch button
		const switchBtn = titleRow.createEl('button', {
			text: '⚡',
			cls: 'vault-switch-btn',
			attr: { title: 'Open vault switcher' }
		});
		switchBtn.addEventListener('click', () => {
			// @ts-ignore - app.setting is not in official API
			const setting = (this.app as any).setting;
			if (setting && setting.open) {
				setting.open();
				setting.openTabById('file'); // Open Files & Links tab where vault management is
				new Notice('Navigate to "Manage vaults" to switch vaults');
			} else {
				new Notice('Open Settings → Files & Links → Manage vaults to switch vaults');
			}
		});

		// Vault info
		const vaultName = this.app.vault.getName();
		header.createEl('div', {
			text: `📁 ${vaultName}`,
			cls: 'vault-council-vault-info'
		});

		// Create context panel (collapsible)
		const contextSection = container.createEl('div', { cls: 'vault-council-context' });
		const contextHeader = contextSection.createEl('div', {
			cls: 'vault-council-context-header',
			text: '📁 Context'
		});
		this.contextEl = contextSection.createEl('div', { cls: 'vault-council-context-content' });

		contextHeader.addEventListener('click', () => {
			this.contextEl.classList.toggle('is-collapsed');
		});

		this.updateContext();

		// Create conversation area
		this.conversationEl = container.createEl('div', { cls: 'vault-council-conversation' });

		// Create input area
		const inputSection = container.createEl('div', { cls: 'vault-council-input-section' });

		this.inputEl = inputSection.createEl('textarea', {
			cls: 'vault-council-input',
			attr: {
				placeholder: 'Ask a question about your notes...',
				rows: '3'
			}
		});

		const buttonContainer = inputSection.createEl('div', { cls: 'vault-council-buttons' });

		const sendBtn = buttonContainer.createEl('button', {
			text: 'Send',
			cls: 'mod-cta'
		});
		sendBtn.addEventListener('click', () => this.sendMessage());

		// Chairman Synthesize button (only if enabled)
		if (this.plugin.settings.enableChairman && this.plugin.settings.chairmanMode === 'manual') {
			const synthesizeBtn = buttonContainer.createEl('button', {
				text: '🎩 Synthesize',
				cls: 'chairman-btn'
			});
			synthesizeBtn.addEventListener('click', () => this.synthesizeResponses());
		}

		const saveBtn = buttonContainer.createEl('button', {
			text: 'Save',
		});
		saveBtn.addEventListener('click', () => this.saveConversation());

		const clearBtn = buttonContainer.createEl('button', {
			text: 'Clear',
		});
		clearBtn.addEventListener('click', () => this.clearConversation());

		// Handle Enter key (Shift+Enter for newline)
		this.inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				this.sendMessage();
			}
		});
	}

	async updateContext() {
		this.contextEl.empty();

		const activeFile = this.app.workspace.getActiveFile();

		if (activeFile) {
			const fileInfo = this.contextEl.createEl('div', { cls: 'context-item' });
			fileInfo.createEl('span', { text: '📄 Current: ', cls: 'context-label' });
			fileInfo.createEl('span', { text: activeFile.basename });

			// Get linked files
			const cache = this.app.metadataCache.getFileCache(activeFile);
			if (cache?.links && cache.links.length > 0) {
				const linksInfo = this.contextEl.createEl('div', { cls: 'context-item' });
				linksInfo.createEl('span', { text: '🔗 Linked: ', cls: 'context-label' });
				linksInfo.createEl('span', { text: `${cache.links.length} files` });
			}

			// Get folder info
			const folderPath = activeFile.parent?.path || '/';
			const folderInfo = this.contextEl.createEl('div', { cls: 'context-item' });
			folderInfo.createEl('span', { text: '📁 Folder: ', cls: 'context-label' });
			folderInfo.createEl('span', { text: folderPath });

		} else {
			this.contextEl.createEl('div', {
				text: 'No active file',
				cls: 'context-empty'
			});
		}
	}

	async sendMessage() {
		const question = this.inputEl.value.trim();
		if (!question) return;

		// Check if API key is configured
		if (!this.plugin.settings.openRouterApiKey) {
			new Notice('Please configure your OpenRouter API key in settings');
			return;
		}

		// Check if models are selected
		if (this.plugin.settings.selectedModels.length === 0) {
			new Notice('Please select at least one model in settings');
			return;
		}

		// Add user message
		this.addMessage({
			role: 'user',
			content: question,
			timestamp: Date.now()
		});

		this.inputEl.value = '';

		// Get context
		const context = await this.gatherContext();

		// Store linked files for metadata
		this.linkedFilesContext = context.linkedFiles.map(f => {
			const match = f.match(/File: (.*?)\n/);
			return match ? match[1] : '';
		}).filter(f => f);

		// Build system prompt with context and response style
		let systemPrompt = 'You are a helpful AI assistant analyzing notes in an Obsidian vault.\n\n';

		// Add response style instruction
		if (this.plugin.settings.responseStyle === 'concise') {
			systemPrompt += 'IMPORTANT: Provide a CONCISE response. Maximum 3-5 key points. Be brief and direct.\n\n';
		} else if (this.plugin.settings.responseStyle === 'detailed') {
			systemPrompt += 'IMPORTANT: Provide a DETAILED, comprehensive response with thorough analysis.\n\n';
		}
		// balanced is default, no special instruction

		if (context.currentFile) {
			systemPrompt += `Current note: ${context.currentFile}\n`;
			systemPrompt += `Content:\n${context.currentFileContent}\n\n`;
		}

		if (context.linkedFiles.length > 0) {
			systemPrompt += `Linked notes (${context.linkedFiles.length}):\n`;
			systemPrompt += context.linkedFiles.join('\n\n');
		}

		if (!context.currentFile && context.linkedFiles.length === 0) {
			systemPrompt += 'No context available. Please answer the question based on your knowledge.';
		}

		// Show loading container with progress for each model
		const loadingContainer = this.conversationEl.createEl('div', {
			cls: 'vault-council-loading-container'
		});

		loadingContainer.createEl('div', {
			cls: 'loading-header',
			text: `🤖 Consulting ${this.plugin.settings.selectedModels.length} models...`
		});

		const progressList = loadingContainer.createEl('div', {
			cls: 'loading-progress-list'
		});

		// Create progress item for each model
		const progressItems = new Map<string, HTMLElement>();
		this.plugin.settings.selectedModels.forEach(modelId => {
			const modelName = this.getModelDisplayName(modelId);
			const progressItem = progressList.createEl('div', {
				cls: 'loading-progress-item'
			});
			progressItem.createEl('span', {
				cls: 'loading-spinner',
				text: '⏳'
			});
			progressItem.createEl('span', {
				cls: 'loading-model-name',
				text: modelName
			});
			progressItems.set(modelId, progressItem);
		});

		try {
			// Create OpenRouter service
			const service = new OpenRouterService(this.plugin.settings.openRouterApiKey);

			// Send to all selected models and update progress
			const modelPromises = this.plugin.settings.selectedModels.map(async (modelId) => {
				try {
					const response = await service.sendMessage(
						modelId,
						question,
						systemPrompt,
						this.plugin.settings.temperature,
						this.plugin.settings.maxTokens
					);

					// Update progress indicator to success
					const progressItem = progressItems.get(modelId);
					if (progressItem) {
						const spinner = progressItem.querySelector('.loading-spinner');
						if (spinner) spinner.textContent = '✅';
						progressItem.addClass('completed');
					}

					return { modelId, response, error: null };
				} catch (error) {
					// Update progress indicator to error
					const progressItem = progressItems.get(modelId);
					if (progressItem) {
						const spinner = progressItem.querySelector('.loading-spinner');
						if (spinner) spinner.textContent = '❌';
						progressItem.addClass('error');
					}

					return { modelId, response: '', error: error.message };
				}
			});

			const modelResults = await Promise.all(modelPromises);

			loadingContainer.remove();

			// Display responses from each model
			modelResults.forEach(({ modelId, response, error }) => {
				const modelName = this.getModelDisplayName(modelId);

				if (error) {
					this.addMessage({
						role: 'assistant',
						content: `Error: ${error}`,
						model: `${modelName} ❌`,
						timestamp: Date.now()
					});
				} else {
					// Track successfully used models
					this.modelsUsedInSession.add(modelId);

					this.addMessage({
						role: 'assistant',
						content: response,
						model: modelName,
						timestamp: Date.now()
					});
				}
			});

			// Automatically synthesize if chairman mode is 'always'
			if (this.plugin.settings.enableChairman && this.plugin.settings.chairmanMode === 'always') {
				await this.synthesizeResponses();
			}

		} catch (error) {
			loadingContainer.remove();
			new Notice(`Error: ${error.message}`);
			this.addMessage({
				role: 'assistant',
				content: `Error: ${error.message}`,
				model: 'System',
				timestamp: Date.now()
			});
		}
	}

	getModelDisplayName(modelId: string): string {
		const parts = modelId.split('/');
		if (parts.length === 2) {
			const provider = parts[0];
			const model = parts[1];
			return `${provider.charAt(0).toUpperCase() + provider.slice(1)} - ${model}`;
		}
		return modelId;
	}

	addMessage(message: Message) {
		this.messages.push(message);

		const messageEl = this.conversationEl.createEl('div', {
			cls: `message ${message.role}`
		});

		if (message.model) {
			const modelLabel = messageEl.createEl('div', {
				cls: 'message-model',
				text: message.model
			});
		}

		const contentEl = messageEl.createEl('div', {
			cls: 'message-content'
		});

		// Render markdown
		contentEl.innerHTML = message.content.replace(/\n/g, '<br>');

		// Scroll to bottom
		this.conversationEl.scrollTop = this.conversationEl.scrollHeight;
	}

	async saveConversation() {
		if (this.messages.length === 0) {
			new Notice('No conversation to save');
			return;
		}

		try {
			const saveManager = new SaveManager(this.app);
			const sourceFile = this.app.workspace.getActiveFile();

			const savedFile = await saveManager.saveConversation(
				this.messages,
				sourceFile,
				this.plugin.settings.saveLocation,
				this.plugin.settings.customSaveFolder,
				this.linkedFilesContext,
				Array.from(this.modelsUsedInSession),
				this.hadChairmanSynthesis,
				this.conversationStartTime
			);

			new Notice(`Conversation saved to: ${savedFile.basename}`);

			// Optionally open the saved file
			const leaf = this.app.workspace.getLeaf('tab');
			await leaf.openFile(savedFile);

		} catch (error) {
			console.error('Error saving conversation:', error);
			new Notice(`Failed to save conversation: ${error.message}`);
		}
	}

	clearConversation() {
		this.messages = [];
		this.conversationEl.empty();
		this.conversationStartTime = Date.now();
		this.linkedFilesContext = [];
		this.modelsUsedInSession.clear();
		this.hadChairmanSynthesis = false;
	}

	async gatherContext() {
		const activeFile = this.app.workspace.getActiveFile();
		const linkedFiles: string[] = [];
		let currentFileContent = '';

		const contextMode = this.plugin.settings.contextMode;

		if (contextMode === 'auto') {
			// Auto mode: Current file + linked files (original behavior)
			if (activeFile) {
				currentFileContent = await this.app.vault.read(activeFile);

				// Get linked files
				const cache = this.app.metadataCache.getFileCache(activeFile);
				if (cache?.links) {
					for (const link of cache.links) {
						const linkedFile = this.app.metadataCache.getFirstLinkpathDest(
							link.link,
							activeFile.path
						);
						if (linkedFile) {
							const content = await this.app.vault.read(linkedFile);
							linkedFiles.push(`File: ${linkedFile.basename}\n${content}`);
						}
					}
				}
			}
		} else if (contextMode === 'folder') {
			// Folder mode: All markdown files in a folder
			let folderPath = this.plugin.settings.customContextFolder;

			// If no custom folder specified, use current file's folder
			if (!folderPath && activeFile) {
				folderPath = activeFile.parent?.path || '';
			}

			if (folderPath) {
				const folder = this.app.vault.getAbstractFileByPath(folderPath);
				if (folder && folder instanceof TFolder) {
					for (const file of folder.children) {
						if (file instanceof TFile && file.extension === 'md') {
							const content = await this.app.vault.read(file);
							linkedFiles.push(`File: ${file.basename}\n${content}`);
						}
					}
				}

				// Also include current file if it's in this folder
				if (activeFile && activeFile.parent?.path === folderPath) {
					currentFileContent = await this.app.vault.read(activeFile);
				}
			}
		} else if (contextMode === 'custom') {
			// Custom mode: Manual file selection (placeholder for now)
			// This would require a file picker UI - implement later
			if (activeFile) {
				currentFileContent = await this.app.vault.read(activeFile);
			}
			// TODO: Implement file picker UI for manual selection
		}

		return {
			currentFile: activeFile?.basename || null,
			currentFileContent,
			linkedFiles,
			folderPath: activeFile?.parent?.path || null,
			selectedFiles: []
		};
	}

	async synthesizeResponses() {
		// Collect all assistant messages from current conversation
		const assistantMessages = this.messages.filter(m => m.role === 'assistant' && m.model && !m.model.includes('Chairman'));

		if (assistantMessages.length === 0) {
			new Notice('No responses to synthesize');
			return;
		}

		// Show loading
		const loadingEl = this.conversationEl.createEl('div', {
			cls: 'message assistant loading',
			text: '🎩 Chairman is synthesizing responses...'
		});

		try {
			// Build chairman prompt
			const chairmanPrompt = `You are the Chairman synthesizing responses from multiple AI models.
Review these responses and provide a unified, balanced synthesis that:
1. Identifies key agreements and disagreements
2. Highlights the most valuable insights
3. Provides a final recommendation or conclusion

Here are the responses from the council:

${assistantMessages.map(m => `**${m.model}:**\n${m.content}`).join('\n\n---\n\n')}

Please provide a concise synthesis (3-5 key points) followed by your final recommendation.`;

			// Create OpenRouter service
			const service = new OpenRouterService(this.plugin.settings.openRouterApiKey);

			// Send to chairman model
			const response = await service.sendMessage(
				this.plugin.settings.chairmanModel,
				chairmanPrompt,
				'You are a Chairman synthesizing multiple expert opinions into actionable insights.',
				this.plugin.settings.temperature,
				this.plugin.settings.maxTokens
			);

			loadingEl.remove();

			// Mark chairman as used
			this.hadChairmanSynthesis = true;

			// Add chairman synthesis
			this.addMessage({
				role: 'assistant',
				content: response,
				model: '🎩 Chairman',
				timestamp: Date.now()
			});

		} catch (error) {
			loadingEl.remove();
			new Notice(`Chairman synthesis failed: ${error.message}`);
			this.addMessage({
				role: 'assistant',
				content: `Error during synthesis: ${error.message}`,
				model: '🎩 Chairman ❌',
				timestamp: Date.now()
			});
		}
	}

	async onClose() {
		// Cleanup
	}
}
