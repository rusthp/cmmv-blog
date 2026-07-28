import { Module } from "@cmmv/core";

import { GeminiModule } from "./gemini/gemini.module";
import { ChatGPTModule } from "./chatgpt/chatgpt.module";
import { GrokModule } from "./grok/grok.module";
import { GroqModule } from "./groq/groq.module";
import { DeepSeekModule } from "./deepseek/deepseek.module";
import { OpenRouterModule } from "./openrouter/openrouter.module";
import { AIContentService } from "./ai-content.service";

export const AIContentModule = new Module("ai-content", {
    submodules: [
        GeminiModule,
        ChatGPTModule,
        DeepSeekModule,
        GrokModule,
        GroqModule,
        OpenRouterModule
    ],
    providers: [AIContentService]
});
