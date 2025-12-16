# Vault Council

Multi-AI model collaboration plugin with vault context awareness for Obsidian.

## Features

- **Sidebar UI**: Persistent conversation panel with chat history
- **Context-Aware**: Automatically uses current note and linked files as context
- **Multi-Model**: Compare responses from GPT-4, Claude, and Gemini simultaneously
- **Smart Save**: Saves analysis next to source note with automatic linking
- **Vault Integration**: Deep integration with your Obsidian vault structure

## Installation

### Development

1. Clone this repo into your vault's `.obsidian/plugins/` directory
2. Run `npm install`
3. Run `npm run dev`
4. Enable the plugin in Obsidian settings

## Usage

1. Open the Vault Council sidebar (ribbon icon or command palette)
2. Type your question
3. Models will use your current note as context automatically
4. Save results - they'll be stored next to your current note with automatic linking

## Configuration

Go to Settings → Vault Council to configure:
- API keys for OpenAI, Anthropic, Google
- Default models to use
- Save location preferences

## Development

```bash
npm install        # Install dependencies
npm run dev        # Watch mode for development
npm run build      # Production build
```

## License

MIT
