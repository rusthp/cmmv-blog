import { Module } from '@cmmv/core';

import { PromptsContract } from '../../contracts';
import { PromptsControllerTools } from './prompts.controller';
import { PromptsServiceTools } from "./prompts.service";

export const PromptsModule = new Module('blog_prompts', {
    contracts: [PromptsContract],
    controllers: [PromptsControllerTools],
    providers: [PromptsServiceTools]
});
