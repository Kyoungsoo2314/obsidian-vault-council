import { App, PluginSettingTab, Setting } from 'obsidian';
import VaultCouncilPlugin from '../../main';
import { AVAILABLE_MODELS } from '../types/types';

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

		// Info section
		const infoEl = containerEl.createEl('div', { cls: 'setting-item-description' });
		infoEl.innerHTML = `
			This plugin uses <a href="https://openrouter.ai">OpenRouter</a> to access multiple AI models with a single API key.<br>
			Get your API key at: <a href="https://openrouter.ai/keys">https://openrouter.ai/keys</a>
		`;

		// OpenRouter API Key
		new Setting(containerEl)
			.setName('OpenRouter API Key')
			.setDesc('Your OpenRouter API key (one key for all models)')
			.addText(text => text
				.setPlaceholder('sk-or-v1-...')
				.setValue(this.plugin.settings.openRouterApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openRouterApiKey = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Model Selection' });
		containerEl.createEl('div', {
			cls: 'setting-item-description',
			text: 'Select which models to use (selected models will respond in parallel)'
		});

		// Create model selection checkboxes
		AVAILABLE_MODELS.forEach(model => {
			new Setting(containerEl)
				.setName(model.name)
				.setDesc(`${model.provider} - ${model.id}`)
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.selectedModels.includes(model.id))
					.onChange(async (value) => {
						if (value) {
							// Add model
							if (!this.plugin.settings.selectedModels.includes(model.id)) {
								this.plugin.settings.selectedModels.push(model.id);
							}
						} else {
							// Remove model
							this.plugin.settings.selectedModels =
								this.plugin.settings.selectedModels.filter(m => m !== model.id);
						}
						await this.plugin.saveSettings();
					}));
		});

		containerEl.createEl('h3', { text: 'Advanced Settings' });

		// Temperature
		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('Controls randomness (0 = focused, 1 = creative)')
			.addSlider(slider => slider
				.setLimits(0, 1, 0.1)
				.setValue(this.plugin.settings.temperature)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.temperature = value;
					await this.plugin.saveSettings();
				}));

		// Max tokens
		new Setting(containerEl)
			.setName('Max Tokens')
			.setDesc('Maximum length of responses')
			.addText(text => text
				.setPlaceholder('4000')
				.setValue(String(this.plugin.settings.maxTokens))
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.maxTokens = num;
						await this.plugin.saveSettings();
					}
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
