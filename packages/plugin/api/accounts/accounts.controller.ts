import {
    Controller, Post,
    Body, ContentType,
    Raw, Req, Res
} from "@cmmv/http";


import {
    AccountsService
} from "./accounts.service";

@Controller('accounts')
export class AccountsController {
    constructor(
        private readonly accountsService: AccountsService
    ){}

    @Post('login/firebase')
    @ContentType('text/plain')
    @Raw()
    async loginWithFirebase(@Body() body: any, @Req() req: any, @Res() res: any) {
        return this.accountsService.firebaseLogin(body, req, res);
    }
}