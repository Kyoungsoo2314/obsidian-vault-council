import { App, PluginSettingTab, Setting } from 'obsidian';
import VaultCouncilPlugin from '../../main';

export class VaultCouncilSettingTab extends PluginSettingTab {
	plugin: VaultCouncilPlugin;

	constructor(app: App, plugin: VaultCouncilPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Vault Council Settings' });

		// OpenAI API Key
		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Your OpenAI API key for GPT models')
			.addText(text => text
				.setPlaceholder('sk-...')
				.setValue(this.plugin.settings.openaiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));

		// Anthropic API Key
		new Setting(containerEl)
			.setName('Anthropic API Key')
			.setDesc('Your Anthropic API key for Claude models')
			.addText(text => text
				.setPlaceholder('sk-ant-...')
				.setValue(this.plugin.settings.anthropicApiKey)
				.onChange(async (value) => {
					this.plugin.settings.anthropicApiKey = value;
					await this.plugin.saveSettings();
				}));

		// Google API Key
		new Setting(containerEl)
			.setName('Google API Key')
			.setDesc('Your Google API key for Gemini models')
			.addText(text => text
				.setPlaceholder('AIza...')
				.setValue(this.plugin.settings.googleApiKey)
				.onChange(async (value) => {
					this.plugin.settings.googleApiKey = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Model Selection' });

		// GPT-4
		new Setting(containerEl)
			.setName('Enable GPT-4')
			.setDesc('Use OpenAI GPT-4 model')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabledModels.gpt4)
				.onChange(async (value) => {
					this.plugin.settings.enabledModels.gpt4 = value;
					await this.plugin.saveSettings();
				}));

		// Claude
		new Setting(containerEl)
			.setName('Enable Claude')
			.setDesc('Use Anthropic Claude model')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabledModels.claude)
				.onChange(async (value) => {
					this.plugin.settings.enabledModels.claude = value;
					await this.plugin.saveSettings();
				}));

		// Gemini
		new Setting(containerEl)
			.setName('Enable Gemini')
			.setDesc('Use Google Gemini model')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enabledModels.gemini)
				.onChange(async (value) => {
					this.plugin.settings.enabledModels.gemini = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Save Settings' });

		// Save location
		new Setting(containerEl)
			.setName('Save location')
			.setDesc('Where to save AI council results')
			.addDropdown(dropdown => dropdown
				.addOption('context-based', 'Next to current note')
				.addOption('custom', 'Custom folder')
				.setValue(this.plugin.settings.saveLocation)
				.onChange(async (value: 'context-based' | 'custom') => {
					this.plugin.settings.saveLocation = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide custom folder setting
				}));

		// Custom folder (only shown if saveLocation is 'custom')
		if (this.plugin.settings.saveLocation === 'custom') {
			new Setting(containerEl)
				.setName('Custom save folder')
				.setDesc('Folder path for saving results')
				.addText(text => text
					.setPlaceholder('AI Council')
					.setValue(this.plugin.settings.customSaveFolder)
					.onChange(async (value) => {
						this.plugin.settings.customSaveFolder = value;
						await this.plugin.saveSettings();
					}));
		}
	}
}
