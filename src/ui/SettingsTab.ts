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

		// Featured models
		const featuredModels = AVAILABLE_MODELS.filter(m => m.featured);
		featuredModels.forEach(model => {
			new Setting(containerEl)
				.setName(model.name)
				.setDesc(`${model.provider} - ${model.id}`)
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.selectedModels.includes(model.id))
					.onChange(async (value) => {
						if (value) {
							if (!this.plugin.settings.selectedModels.includes(model.id)) {
								this.plugin.settings.selectedModels.push(model.id);
							}
						} else {
							this.plugin.settings.selectedModels =
								this.plugin.settings.selectedModels.filter(m => m !== model.id);
						}
						await this.plugin.saveSettings();
					}));
		});

		// Show more models toggle
		const showMoreContainer = containerEl.createEl('div', { cls: 'vault-council-show-more' });
		const showMoreBtn = showMoreContainer.createEl('button', {
			text: '▶ Show More Models',
			cls: 'vault-council-toggle-btn'
		});

		const additionalModelsContainer = containerEl.createEl('div', {
			cls: 'vault-council-additional-models',
			attr: { style: 'display: none;' }
		});

		// Additional models grouped by provider
		const nonFeaturedModels = AVAILABLE_MODELS.filter(m => !m.featured);
		const providers = [...new Set(nonFeaturedModels.map(m => m.provider))];

		providers.forEach(provider => {
			const providerSection = additionalModelsContainer.createEl('div', {
				cls: 'vault-council-provider-section'
			});
			providerSection.createEl('h4', { text: `${provider} Models` });

			nonFeaturedModels
				.filter(m => m.provider === provider)
				.forEach(model => {
					new Setting(providerSection)
						.setName(model.name)
						.setDesc(model.id)
						.addToggle(toggle => toggle
							.setValue(this.plugin.settings.selectedModels.includes(model.id))
							.onChange(async (value) => {
								if (value) {
									if (!this.plugin.settings.selectedModels.includes(model.id)) {
										this.plugin.settings.selectedModels.push(model.id);
									}
								} else {
									this.plugin.settings.selectedModels =
										this.plugin.settings.selectedModels.filter(m => m !== model.id);
								}
								await this.plugin.saveSettings();
							}));
				});
		});

		let isExpanded = false;
		showMoreBtn.addEventListener('click', () => {
			isExpanded = !isExpanded;
			if (isExpanded) {
				additionalModelsContainer.style.display = 'block';
				showMoreBtn.textContent = '▼ Hide Additional Models';
			} else {
				additionalModelsContainer.style.display = 'none';
				showMoreBtn.textContent = '▶ Show More Models';
			}
		});

		containerEl.createEl('h3', { text: 'Response Settings' });

		// Response Style
		new Setting(containerEl)
			.setName('Response Style')
			.setDesc('Control the length and detail of responses')
			.addDropdown(dropdown => dropdown
				.addOption('concise', 'Concise (brief, 3-5 points)')
				.addOption('balanced', 'Balanced (moderate detail)')
				.addOption('detailed', 'Detailed (comprehensive)')
				.setValue(this.plugin.settings.responseStyle)
				.onChange(async (value: 'concise' | 'balanced' | 'detailed') => {
					this.plugin.settings.responseStyle = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Context Settings' });
		containerEl.createEl('div', {
			cls: 'setting-item-description',
			text: 'Control which files are analyzed when asking questions'
		});

		// Context Mode
		new Setting(containerEl)
			.setName('Context Mode')
			.setDesc('How to gather context for AI analysis')
			.addDropdown(dropdown => dropdown
				.addOption('auto', 'Auto (current file + linked files)')
				.addOption('folder', 'Folder (all files in a folder)')
				.addOption('custom', 'Custom (manual selection - coming soon)')
				.setValue(this.plugin.settings.contextMode)
				.onChange(async (value: 'auto' | 'folder' | 'custom') => {
					this.plugin.settings.contextMode = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide folder setting
				}));

		// Custom context folder (only shown if contextMode is 'folder')
		if (this.plugin.settings.contextMode === 'folder') {
			new Setting(containerEl)
				.setName('Context folder')
				.setDesc('Folder path to analyze (leave empty for current folder)')
				.addText(text => text
					.setPlaceholder('folder/subfolder')
					.setValue(this.plugin.settings.customContextFolder)
					.onChange(async (value) => {
						this.plugin.settings.customContextFolder = value;
						await this.plugin.saveSettings();
					}));
		}

		containerEl.createEl('h3', { text: 'Chairman Settings' });
		containerEl.createEl('div', {
			cls: 'setting-item-description',
			text: 'The Chairman synthesizes responses from all models into a final recommendation'
		});

		// Enable Chairman
		new Setting(containerEl)
			.setName('Enable Chairman')
			.setDesc('Add a synthesis step after model responses')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableChairman)
				.onChange(async (value) => {
					this.plugin.settings.enableChairman = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide chairman options
				}));

		if (this.plugin.settings.enableChairman) {
			// Chairman Model
			new Setting(containerEl)
				.setName('Chairman Model')
				.setDesc('Which model acts as chairman')
				.addDropdown(dropdown => {
					AVAILABLE_MODELS.filter(m => m.featured).forEach(model => {
						dropdown.addOption(model.id, model.name);
					});
					return dropdown
						.setValue(this.plugin.settings.chairmanModel)
						.onChange(async (value) => {
							this.plugin.settings.chairmanModel = value;
							await this.plugin.saveSettings();
						});
				});

			// Chairman Mode
			new Setting(containerEl)
				.setName('Chairman Mode')
				.setDesc('When to synthesize responses')
				.addDropdown(dropdown => dropdown
					.addOption('manual', 'Manual (Synthesize button)')
					.addOption('always', 'Always (automatic)')
					.setValue(this.plugin.settings.chairmanMode)
					.onChange(async (value: 'manual' | 'always') => {
						this.plugin.settings.chairmanMode = value;
						await this.plugin.saveSettings();
					}));
		}

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
