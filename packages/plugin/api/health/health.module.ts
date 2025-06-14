import { Module } from '@cmmv/core';

import { HealthController } from './health.controller';
import { HealthService } from "./health.service";

export const HealthModule = new Module('blog_health', {
    controllers: [HealthController],
    providers: [HealthService]
});
