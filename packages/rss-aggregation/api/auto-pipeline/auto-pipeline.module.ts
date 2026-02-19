import { Module } from '@cmmv/core';

import {
    AutoPipelineService
} from "./auto-pipeline.service";

import {
    AutoPipelineController
} from "./auto-pipeline.controller";

export const AutoPipelineModule = new Module('auto-pipeline', {
    providers: [AutoPipelineService],
    controllers: [AutoPipelineController],
});
