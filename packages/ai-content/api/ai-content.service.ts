import { Service, Config } from "@cmmv/core";
import { GeminiService } from "./gemini/gemini.service";
import { ChatGPTService } from "./chatgpt/chatgpt.service";
import { DeepSeekService } from "./deepseek/deepseek.service";
import { GrokService } from "./grok/grok.service";
import { GroqService } from "./groq/groq.service";

@Service()
export class AIContentService {
    constructor(
        private readonly geminiService: GeminiService,
        private readonly chatgptService: ChatGPTService,
        private readonly grokService: GrokService,
        private readonly groqService: GroqService,
        private readonly deepseekService: DeepSeekService
    ) {}

    private static readonly fallbackOrder = ["deepseek", "groq", "gemini"];

    async generateContent(prompt: string): Promise<string> {
        const aiService = Config.get("blog.aiService", "deepseek");

        const order = [aiService, ...AIContentService.fallbackOrder.filter(name => name !== aiService)];
        const chain = order
            .map(name => ({ name, service: this.resolveService(name) }))
            .filter((entry): entry is { name: string; service: { generateContent(prompt: string): Promise<string> } } => entry.service !== null);

        let lastError: unknown;

        for (const { name, service } of chain) {
            try {
                return await service.generateContent(prompt);
            } catch (error) {
                lastError = error;
                console.error(`[AIContentService] ${name} failed, trying next provider:`, error instanceof Error ? error.message : error);
            }
        }

        throw new Error(`All AI providers failed to generate content: ${lastError instanceof Error ? lastError.message : lastError}`);
    }

    private resolveService(aiService: string) {
        switch(aiService) {
            case "gemini":
                return this.geminiService;
            case "chatgpt":
                return this.chatgptService;
            case "grok":
                return this.grokService;
            case "groq":
                return this.groqService;
            case "deepseek":
                return this.deepseekService;
            default:
                return null;
        }
    }
}
