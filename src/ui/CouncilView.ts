import { ItemView, WorkspaceLeaf, TFile, MarkdownView, Notice } from 'obsidian';
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
		header.createEl('h4', { text: 'Vault Council', cls: 'vault-council-title' });

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

		// Build system prompt with context
		let systemPrompt = 'You are a helpful AI assistant analyzing notes in an Obsidian vault.\n\n';

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

		// Show loading
		const loadingEl = this.conversationEl.createEl('div', {
			cls: 'message assistant loading',
			text: `Consulting ${this.plugin.settings.selectedModels.length} models...`
		});

		try {
			// Create OpenRouter service
			const service = new OpenRouterService(this.plugin.settings.openRouterApiKey);

			// Send to all selected models in parallel
			const results = await service.sendMessageToMultipleModels(
				this.plugin.settings.selectedModels,
				question,
				systemPrompt,
				this.plugin.settings.temperature,
				this.plugin.settings.maxTokens
			);

			loadingEl.remove();

			// Display responses from each model
			results.forEach((result, modelId) => {
				const modelName = this.getModelDisplayName(modelId);

				if (result.error) {
					this.addMessage({
						role: 'assistant',
						content: `Error: ${result.error}`,
						model: `${modelName} ❌`,
						timestamp: Date.now()
					});
				} else {
					this.addMessage({
						role: 'assistant',
						content: result.response,
						model: modelName,
						timestamp: Date.now()
					});
				}
			});

		} catch (error) {
			loadingEl.remove();
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
				this.plugin.settings.customSaveFolder
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
	}

	async gatherContext() {
		const activeFile = this.app.workspace.getActiveFile();
		const linkedFiles: string[] = [];
		let currentFileContent = '';

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

		return {
			currentFile: activeFile?.basename || null,
			currentFileContent,
			linkedFiles,
			folderPath: activeFile?.parent?.path || null,
			selectedFiles: []
		};
	}

	async onClose() {
		// Cleanup
	}
}
