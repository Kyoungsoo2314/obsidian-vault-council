import { OpenRouterService } from './OpenRouterService';

export interface Opinion {
	model: string;
	content: string;
}

export interface Review {
	reviewer: string;
	content: string;
}

export class CouncilService {
	private openRouterService: OpenRouterService;

	constructor(openRouterService: OpenRouterService) {
		this.openRouterService = openRouterService;
	}

	/**
	 * Step 1: Get initial opinions from all council members
	 */
	async getOpinions(
		models: string[],
		query: string,
		language: string
	): Promise<Opinion[]> {
		const systemPrompt = `You are a member of the LLM Council. Provide a concise and accurate answer to the user's query. IMPORTANT: You MUST answer in ${language}.`;

		const results = await this.openRouterService.sendMessageToMultipleModels(
			models,
			query,
			systemPrompt
		);

		const opinions: Opinion[] = [];
		for (const [model, result] of results.entries()) {
			opinions.push({
				model,
				content: result.error ? `Error: ${result.error}` : result.response
			});
		}

		return opinions;
	}

	/**
	 * Step 2: Get peer reviews - each model critiques other models' opinions
	 */
	async getReviews(
		models: string[],
		query: string,
		opinions: Opinion[],
		language: string
	): Promise<Review[]> {
		// Format opinions for review
		const opinionsText = opinions
			.map(op => `[${op.model}]: ${op.content}`)
			.join('\n\n---\n\n');

		const systemPrompt = `You are a member of the LLM Council. Review the following opinions from other models on the user's query. Critique them for accuracy, bias, and insight. Be constructive. IMPORTANT: You MUST answer in ${language}.`;

		const userMessage = `Query: ${query}

Opinions to Review:
${opinionsText}`;

		const results = await this.openRouterService.sendMessageToMultipleModels(
			models,
			userMessage,
			systemPrompt
		);

		const reviews: Review[] = [];
		for (const [model, result] of results.entries()) {
			reviews.push({
				reviewer: model,
				content: result.error ? `Error: ${result.error}` : result.response
			});
		}

		return reviews;
	}

	/**
	 * Step 3: Chairman synthesizes final answer based on opinions AND peer reviews
	 */
	async getChairmanSynthesis(
		chairmanModel: string,
		query: string,
		opinions: Opinion[],
		reviews: Review[],
		language: string
	): Promise<string> {
		const opinionsText = opinions
			.map(op => `[Model: ${op.model}]: ${op.content}`)
			.join('\n\n');

		const reviewsText = reviews
			.map(rw => `[Reviewer: ${rw.reviewer}]: ${rw.content}`)
			.join('\n\n');

		const systemPrompt = `You are the Chairman of the LLM Council. Synthesize the final answer based on the council members' opinions and their peer reviews. Highlight consensus and disagreements. IMPORTANT: You MUST answer in ${language}.`;

		const userMessage = `Query: ${query}

Council Opinions:
${opinionsText}

Peer Reviews:
${reviewsText}`;

		const response = await this.openRouterService.sendMessage(
			chairmanModel,
			userMessage,
			systemPrompt
		);

		return response;
	}
}
