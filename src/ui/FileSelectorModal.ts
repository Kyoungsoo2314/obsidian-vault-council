import { SuggestModal, TFile, App } from 'obsidian';
import { CouncilView } from './CouncilView';

export class FileSelectorModal extends SuggestModal<TFile> {
	view: CouncilView;

	constructor(app: App, view: CouncilView) {
		super(app);
		this.view = view;
		this.setPlaceholder('Type to search for files...');
	}

	// Returns all markdown files in the vault
	getSuggestions(query: string): TFile[] {
		const allFiles = this.app.vault.getMarkdownFiles();

		if (!query) {
			return allFiles;
		}

		const lowerQuery = query.toLowerCase();
		return allFiles.filter(file =>
			file.basename.toLowerCase().includes(lowerQuery) ||
			file.path.toLowerCase().includes(lowerQuery)
		);
	}

	// Renders each suggestion item
	renderSuggestion(file: TFile, el: HTMLElement) {
		el.createEl('div', { text: file.basename, cls: 'suggestion-item-title' });
		el.createEl('small', { text: file.path, cls: 'suggestion-item-note' });
	}

	// Called when the user selects a suggestion
	onChooseSuggestion(file: TFile, evt: MouseEvent | KeyboardEvent) {
		this.view.addCustomFile(file);
	}
}
