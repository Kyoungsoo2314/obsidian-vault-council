import { ItemView, WorkspaceLeaf, TFile, MarkdownView } from 'obsidian';
import VaultCouncilPlugin from '../../main';
import { Message, ModelResponse } from '../types/types';

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

		// Add user message
		this.addMessage({
			role: 'user',
			content: question,
			timestamp: Date.now()
		});

		this.inputEl.value = '';

		// Get context
		const context = await this.gatherContext();

		// Show loading
		const loadingEl = this.conversationEl.createEl('div', {
			cls: 'message assistant loading',
			text: 'Thinking...'
		});

		// TODO: Send to AI models
		// For now, show placeholder
		setTimeout(() => {
			loadingEl.remove();
			this.addMessage({
				role: 'assistant',
				content: `This is a placeholder response. Context gathered:\n- Current file: ${context.currentFile || 'none'}\n- Linked files: ${context.linkedFiles.length}\n\nYour question: "${question}"\n\nAI integration coming soon!`,
				model: 'system',
				timestamp: Date.now()
			});
		}, 1000);
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
