export interface VaultCouncilSettings {
	openRouterApiKey: string;
	selectedModels: string[];
	saveLocation: 'context-based' | 'custom';
	customSaveFolder: string;
	temperature: number;
	maxTokens: number;
	responseStyle: 'concise' | 'balanced' | 'detailed';
	enableChairman: boolean;
	chairmanModel: string;
	chairmanMode: 'manual' | 'always';
	contextMode: 'auto' | 'folder' | 'custom';
	customContextFolder: string;
}

export const DEFAULT_SETTINGS: VaultCouncilSettings = {
	openRouterApiKey: '',
	selectedModels: [
		'openai/gpt-5.2',
		'anthropic/claude-4.5-sonnet-20250929',
		'google/gemini-3-pro-preview-20251117',
		'x-ai/grok-4.1-fast'
	],
	saveLocation: 'context-based',
	customSaveFolder: 'AI Council',
	temperature: 0.7,
	maxTokens: 4000,
	responseStyle: 'concise',
	enableChairman: false,
	chairmanModel: 'anthropic/claude-4.5-sonnet-20250929',
	chairmanMode: 'manual',
	contextMode: 'auto',
	customContextFolder: '',
};

// Available models on OpenRouter (December 2025)
export const AVAILABLE_MODELS = [
	// Featured Models (Latest - December 2025)
	{ id: 'openai/gpt-5.2', name: 'GPT-5.2 🔥', provider: 'OpenAI', featured: true },
	{ id: 'anthropic/claude-4.5-sonnet-20250929', name: 'Claude 4.5 Sonnet 🔥', provider: 'Anthropic', featured: true },
	{ id: 'google/gemini-3-pro-preview-20251117', name: 'Gemini 3 Pro Preview 🔥', provider: 'Google', featured: true },
	{ id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast 🔥', provider: 'xAI', featured: true },

	// OpenAI GPT-5 Series
	{ id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', featured: false },
	{ id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', featured: false },
	{ id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', featured: false },
	{ id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI', featured: false },

	// Anthropic Claude 4.5 Series
	{ id: 'anthropic/claude-4.5-opus-20251124', name: 'Claude 4.5 Opus 🔥', provider: 'Anthropic', featured: false },
	{ id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', featured: false },
	{ id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', featured: false },
	{ id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', featured: false },
	{ id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', featured: false },

	// Google Gemini 3 & 2.5 Series
	{ id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro Preview', provider: 'Google', featured: false },
	{ id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', featured: false },
	{ id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', featured: false },
	{ id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', featured: false },

	// xAI Grok Series
	{ id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI', featured: false },
	{ id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast', provider: 'xAI', featured: false },
	{ id: 'x-ai/grok-3', name: 'Grok 3', provider: 'xAI', featured: false },
	{ id: 'x-ai/grok-3-mini', name: 'Grok 3 Mini', provider: 'xAI', featured: false },
];

export interface Message {
	role: 'user' | 'assistant';
	content: string;
	model?: string;
	timestamp: number;
}

export interface ConversationContext {
	currentFile: string | null;
	linkedFiles: string[];
	folderPath: string | null;
	selectedFiles: string[];
}

export interface ModelResponse {
	model: string;
	response: string;
	error?: string;
	timestamp: number;
}

export interface LLMService {
	name: string;
	sendMessage(prompt: string, context: string): Promise<string>;
	isConfigured(): boolean;
}
