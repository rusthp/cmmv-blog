import {
    Controller, Get,
    CacheControl, ContentType,
    Raw, Res, Query
} from "@cmmv/http";

import {
    NetworksService
} from "./networks.service";

@Controller("affiliate/networks")
export class NetworksController {
    constructor(private readonly networksService: NetworksService){}

    @Get("export")
    async export(@Res() response: any, @Query("token") token: string){
        if(token !== process.env.API_SIGNATURE)
            throw new Error("Invalid token");

        const data: string = await this.networksService.export();

        response.res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="networks.json"`,
            'Content-Length': Buffer.byteLength(data, 'utf-8')
        });

        response.res.end(data);
    }
}
