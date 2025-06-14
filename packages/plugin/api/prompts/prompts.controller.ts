import {
    Controller, Get, RouterSchema,
    Queries, Req, Param,
    CacheControl, ContentType, Raw
} from "@cmmv/http";

import {
    Application
} from "@cmmv/core";

import {
    PromptsServiceTools
} from "./prompts.service";

@Controller("blog")
export class PromptsControllerTools {
    constructor(private readonly promptsService: PromptsServiceTools){}
}
