export interface VaultCouncilSettings {
	openRouterApiKey: string;
	selectedModels: string[];
	saveLocation: 'context-based' | 'custom';
	customSaveFolder: string;
	temperature: number;
	maxTokens: number;
}

export const DEFAULT_SETTINGS: VaultCouncilSettings = {
	openRouterApiKey: '',
	selectedModels: [
		'openai/gpt-4-turbo',
		'anthropic/claude-3.5-sonnet',
		'google/gemini-pro-1.5'
	],
	saveLocation: 'context-based',
	customSaveFolder: 'AI Council',
	temperature: 0.7,
	maxTokens: 4000,
};

// Available models on OpenRouter
export const AVAILABLE_MODELS = [
	{ id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
	{ id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI' },
	{ id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
	{ id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
	{ id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
	{ id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
	{ id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google' },
	{ id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
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
