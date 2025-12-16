import { App, TFile, Notice } from 'obsidian';
import { Message } from '../types/types';

export class SaveManager {
	constructor(private app: App) {}

	/**
	 * Save conversation to a new note
	 * @param messages - Array of conversation messages
	 * @param sourceFile - The file that was used as context (optional)
	 * @param saveLocation - 'context-based' or 'custom'
	 * @param customFolder - Custom folder path if saveLocation is 'custom'
	 * @returns The created file
	 */
	async saveConversation(
		messages: Message[],
		sourceFile: TFile | null,
		saveLocation: 'context-based' | 'custom',
		customFolder: string = 'AI Council'
	): Promise<TFile> {
		const timestamp = this.getTimestamp();
		const date = this.getDateString();

		// Generate filename
		let filename: string;
		let folderPath: string;

		if (saveLocation === 'context-based' && sourceFile) {
			// Save next to source file
			const baseName = sourceFile.basename;
			filename = `${baseName}_ai-council_${timestamp}.md`;
			folderPath = sourceFile.parent?.path || '';
		} else {
			// Save in custom folder
			filename = `ai-council_${timestamp}.md`;
			folderPath = customFolder;

			// Create custom folder if it doesn't exist
			if (!(await this.app.vault.adapter.exists(folderPath))) {
				await this.app.vault.createFolder(folderPath);
			}
		}

		const filePath = folderPath ? `${folderPath}/${filename}` : filename;

		// Build content
		const content = this.buildMarkdownContent(messages, sourceFile, date);

		// Create file
		const newFile = await this.app.vault.create(filePath, content);

		// If context-based, add link to source file
		if (saveLocation === 'context-based' && sourceFile) {
			await this.addLinkToSourceFile(sourceFile, newFile);
		}

		return newFile;
	}

	private buildMarkdownContent(
		messages: Message[],
		sourceFile: TFile | null,
		date: string
	): string {
		let content = `---\n`;
		content += `created: ${new Date().toISOString()}\n`;
		content += `tags: [ai-council, conversation]\n`;
		if (sourceFile) {
			content += `source: "[[${sourceFile.basename}]]"\n`;
		}
		content += `---\n\n`;

		content += `# AI Council Conversation\n\n`;

		if (sourceFile) {
			content += `**Source Note:** [[${sourceFile.basename}]]\n`;
		}
		content += `**Date:** ${date}\n\n`;

		content += `---\n\n`;

		// Add conversation
		for (const msg of messages) {
			if (msg.role === 'user') {
				content += `## 🙋 Question\n\n${msg.content}\n\n`;
			} else if (msg.role === 'assistant') {
				const modelLabel = msg.model ? ` (${msg.model})` : '';
				content += `## 🤖 Response${modelLabel}\n\n${msg.content}\n\n`;
			}
		}

		return content;
	}

	private async addLinkToSourceFile(sourceFile: TFile, newFile: TFile): Promise<void> {
		try {
			const content = await this.app.vault.read(sourceFile);

			// Check if link already exists
			const linkText = `[[${newFile.basename}]]`;
			if (content.includes(linkText)) {
				return; // Link already exists
			}

			// Add link at the end with a section header
			let newContent = content;

			// Check if there's already an "AI Analysis" section
			if (!content.includes('## AI Analysis')) {
				newContent += '\n\n---\n\n## AI Analysis\n\n';
			} else {
				newContent += '\n';
			}

			newContent += `- ${linkText} - AI Council conversation (${this.getDateString()})\n`;

			await this.app.vault.modify(sourceFile, newContent);
		} catch (error) {
			console.error('Error adding link to source file:', error);
			// Don't throw - link addition is non-critical
		}
	}

	private getTimestamp(): string {
		const now = new Date();
		return now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
			now.toTimeString().split(' ')[0].replace(/:/g, '-');
	}

	private getDateString(): string {
		const now = new Date();
		return now.toISOString().split('T')[0];
	}
}
