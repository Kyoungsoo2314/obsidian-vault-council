# Vault Council

> Multi-AI model collaboration plugin with vault context awareness for Obsidian

Compare responses from the latest AI models (GPT-5.2, Claude 4.5 Opus, Gemini 3 Pro) simultaneously while leveraging your Obsidian vault's context.

## ✨ Features

### 🎯 Core Features
- **Sidebar UI**: Persistent conversation panel with full chat history
- **Context-Aware**: Automatically reads current note + linked files as context
- **Multi-Model Comparison**: Query multiple AI models in parallel
- **Smart Save**: Context-based saving next to source notes with automatic backlinking
- **OpenRouter Integration**: One API key for all models

### 🤖 Supported Models (via OpenRouter - December 2025)
- **OpenAI**: GPT-5.2 🔥, GPT-5, GPT-5 Mini, GPT-4 Turbo, GPT-4
- **Anthropic**: Claude 4.5 Opus 🔥, Claude 4.5 Sonnet 🔥, Claude Sonnet 4, Claude 3.7 Sonnet, Claude 3.5 Sonnet
- **Google**: Gemini 3 Pro Preview 🔥, Gemini 2.5 Pro Preview, Gemini 2.5 Flash, Gemini 2.0 Flash

## 📦 Installation

### Method 1: BRAT (Recommended)

1. Install [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat)
2. Open command palette and run "BRAT: Add a beta plugin for testing"
3. Enter this repository URL: `https://github.com/Kyoungsoo2314/obsidian-vault-council`
4. Enable "Vault Council" in Community Plugins settings

### Method 2: Manual

1. Download latest release from [Releases](https://github.com/Kyoungsoo2314/obsidian-vault-council/releases)
2. Extract to `.obsidian/plugins/obsidian-vault-council/`
3. Reload Obsidian
4. Enable "Vault Council" in Community Plugins

### Method 3: Development

```bash
cd /path/to/your/vault/.obsidian/plugins
git clone https://github.com/Kyoungsoo2314/obsidian-vault-council.git
cd obsidian-vault-council
npm install
npm run dev
```

## 🚀 Quick Start

1. **Get OpenRouter API Key**
   - Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Create account and generate API key

2. **Configure Plugin**
   - Go to Settings → Vault Council
   - Paste your OpenRouter API key
   - Select models you want to use

3. **Start Chatting**
   - Click ribbon icon (🤖) or use command "Open Vault Council"
   - Ask questions about your notes
   - Save conversations for future reference

## 💡 Usage Examples

### Example 1: Analyze Current Note
1. Open any note in your vault
2. Open Vault Council sidebar
3. Ask: "Summarize this note in 3 key points"
4. See responses from multiple models
5. Click "Save" to create linked analysis

### Example 2: Compare Linked Notes
1. Open a note with many `[[wikilinks]]`
2. Ask: "What are the common themes across these linked notes?"
3. Plugin automatically includes all linked content as context

### Example 3: Context-Based Saving
- Saves to: `your-note_ai-council_2025-12-16.md` (next to original)
- Automatically adds link in original note under "## AI Analysis"
- Includes full conversation with YAML frontmatter

## ⚙️ Configuration

### Settings Panel

**API Configuration**
- OpenRouter API Key (required)

**Model Selection**
- Toggle individual models on/off
- Selected models query in parallel

**Advanced Settings**
- Temperature (0-1): Control creativity vs. focus
- Max Tokens: Response length limit

**Save Settings**
- Context-based: Save next to current note (default)
- Custom folder: Save all conversations in one place

## 🏗️ Architecture

```
obsidian-vault-council/
├── src/
│   ├── ui/
│   │   ├── CouncilView.ts       # Sidebar interface
│   │   └── SettingsTab.ts       # Settings panel
│   ├── services/
│   │   └── OpenRouterService.ts # API integration
│   ├── vault/
│   │   └── SaveManager.ts       # Context-based saving
│   └── types/
│       └── types.ts             # TypeScript definitions
├── main.ts                       # Plugin entry point
├── manifest.json                 # Plugin metadata
└── styles.css                    # UI styling
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Development mode (auto-rebuild on changes)
npm run dev

# Production build
npm run build

# Type checking
npm run build
```

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 Changelog

### v0.2.0 (December 2025) 🆕
- **Updated to latest AI models**: GPT-5.2, Claude 4.5 Opus/Sonnet, Gemini 3 Pro
- Added support for 17 cutting-edge AI models
- Updated default selections to newest flagship models

### v0.1.0 (Initial Release)
- Sidebar UI with conversation history
- OpenRouter integration
- Multi-model parallel querying
- Context-aware prompting
- Context-based saving with auto-linking

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- Powered by [OpenRouter](https://openrouter.ai)
- Inspired by [obsidian-llm-council](https://github.com/sangpsy0/obsidian-llm-council)

## 📧 Support

- Report issues: [GitHub Issues](https://github.com/Kyoungsoo2314/obsidian-vault-council/issues)
- Discussions: [GitHub Discussions](https://github.com/Kyoungsoo2314/obsidian-vault-council/discussions)
