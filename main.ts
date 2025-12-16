import { Plugin } from 'obsidian';
import { VaultCouncilSettings, DEFAULT_SETTINGS } from './src/types/types';
import { CouncilView, VIEW_TYPE_COUNCIL } from './src/ui/CouncilView';
import { VaultCouncilSettingTab } from './src/ui/SettingsTab';

export default class VaultCouncilPlugin extends Plugin {
	settings: VaultCouncilSettings;

	async onload() {
		await this.loadSettings();

		// Register the sidebar view
		this.registerView(
			VIEW_TYPE_COUNCIL,
			(leaf) => new CouncilView(leaf, this)
		);

		// Add ribbon icon
		this.addRibbonIcon('bot', 'Open Vault Council', () => {
			this.activateView();
		});

		// Add command
		this.addCommand({
			id: 'open-vault-council',
			name: 'Open Vault Council',
			callback: () => {
				this.activateView();
			}
		});

		// Add settings tab
		this.addSettingTab(new VaultCouncilSettingTab(this.app, this));

		console.log('Vault Council plugin loaded');
	}

	onunload() {
		console.log('Vault Council plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_COUNCIL)[0];

		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VIEW_TYPE_COUNCIL,
					active: true,
				});
				leaf = rightLeaf;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
