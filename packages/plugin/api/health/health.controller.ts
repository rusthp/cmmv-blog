import {
    Controller, Get,
    ContentType, Raw
} from "@cmmv/http";

import {
    HealthService
} from "./health.service";

@Controller("blog")
export class HealthController {
    constructor(private readonly healthService: HealthService){}

    @Get("health")
    @ContentType("application/json")
    @Raw()
    async getHealth() {
        return await this.healthService.getHealth();
    }
}
