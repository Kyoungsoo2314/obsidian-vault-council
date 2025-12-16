export interface VaultCouncilSettings {
	openaiApiKey: string;
	anthropicApiKey: string;
	googleApiKey: string;
	enabledModels: {
		gpt4: boolean;
		claude: boolean;
		gemini: boolean;
	};
	defaultModels: string[];
	saveLocation: 'context-based' | 'custom';
	customSaveFolder: string;
}

export const DEFAULT_SETTINGS: VaultCouncilSettings = {
	openaiApiKey: '',
	anthropicApiKey: '',
	googleApiKey: '',
	enabledModels: {
		gpt4: true,
		claude: true,
		gemini: true,
	},
	defaultModels: ['gpt-4', 'claude-3-5-sonnet-20241022', 'gemini-pro'],
	saveLocation: 'context-based',
	customSaveFolder: 'AI Council',
};

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
