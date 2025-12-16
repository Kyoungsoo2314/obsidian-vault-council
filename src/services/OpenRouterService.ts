import { requestUrl, RequestUrlParam } from 'obsidian';

export interface OpenRouterMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}

export interface OpenRouterRequest {
	model: string;
	messages: OpenRouterMessage[];
	temperature?: number;
	max_tokens?: number;
}

export interface OpenRouterResponse {
	id: string;
	model: string;
	choices: {
		message: {
			role: string;
			content: string;
		};
		finish_reason: string;
	}[];
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export class OpenRouterService {
	private apiKey: string;
	private baseUrl: string = 'https://openrouter.ai/api/v1';

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async sendMessage(
		model: string,
		userMessage: string,
		systemPrompt?: string,
		temperature: number = 0.7,
		maxTokens: number = 4000
	): Promise<string> {
		const messages: OpenRouterMessage[] = [];

		if (systemPrompt) {
			messages.push({
				role: 'system',
				content: systemPrompt
			});
		}

		messages.push({
			role: 'user',
			content: userMessage
		});

		const requestData: OpenRouterRequest = {
			model,
			messages,
			temperature,
			max_tokens: maxTokens
		};

		try {
			const response = await requestUrl({
				url: `${this.baseUrl}/chat/completions`,
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.apiKey}`,
					'Content-Type': 'application/json',
					'HTTP-Referer': 'https://github.com/Kyoungsoo2314/obsidian-vault-council',
					'X-Title': 'Obsidian Vault Council'
				},
				body: JSON.stringify(requestData)
			});

			const data = response.json as OpenRouterResponse;

			if (data.choices && data.choices.length > 0) {
				return data.choices[0].message.content;
			} else {
				throw new Error('No response from model');
			}
		} catch (error) {
			console.error(`OpenRouter API Error for model ${model}:`, error);
			throw new Error(`Failed to get response from ${model}: ${error.message}`);
		}
	}

	async sendMessageToMultipleModels(
		models: string[],
		userMessage: string,
		systemPrompt?: string,
		temperature: number = 0.7,
		maxTokens: number = 4000
	): Promise<Map<string, { response: string; error?: string }>> {
		const results = new Map<string, { response: string; error?: string }>();

		// Send requests in parallel
		const promises = models.map(async (model) => {
			try {
				const response = await this.sendMessage(
					model,
					userMessage,
					systemPrompt,
					temperature,
					maxTokens
				);
				results.set(model, { response });
			} catch (error) {
				results.set(model, {
					response: '',
					error: error.message
				});
			}
		});

		await Promise.all(promises);
		return results;
	}

	isConfigured(): boolean {
		return !!(this.apiKey && this.apiKey.length > 0);
	}
}
