import { Module } from "@cmmv/core";
import { OpenRouterService } from "./openrouter.service";

export const OpenRouterModule = new Module("ai-content-openrouter", {
    providers: [OpenRouterService]
});
