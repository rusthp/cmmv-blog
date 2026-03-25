import {
    Controller, Post, Body,
    Get, Put, Delete,
    Param, Queries, Req
} from "@cmmv/http";

import { Auth } from "@cmmv/auth";
import { ContactService } from "./contact.service";

@Controller("blog")
export class ContactPublicController {
    constructor(private readonly contactService: ContactService) {}

    @Post("contact")
    async createContact(@Body() body: any, @Req() req: any) {
        const { name, email, subject, message } = body;

        if (!name || !email || !subject || !message)
            return { result: false, message: "Todos os campos são obrigatórios" };

        const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
            || req?.connection?.remoteAddress
            || null;

        await this.contactService.createContact({ name, email, subject, message, ip });
        return { result: true, message: "Mensagem enviada com sucesso!" };
    }
}

@Controller()
export class ContactAdminController {
    constructor(private readonly contactService: ContactService) {}

    @Get("contacts")
    @Auth({ rootOnly: true })
    async getContacts(@Queries() queries: any) {
        return this.contactService.getContacts(queries);
    }

    @Put("contacts/:id")
    @Auth({ rootOnly: true })
    async updateStatus(@Param("id") id: string, @Body() body: any) {
        return this.contactService.updateStatus(id, body.status);
    }

    @Delete("contacts/:id")
    @Auth({ rootOnly: true })
    async deleteContact(@Param("id") id: string) {
        return this.contactService.deleteContact(id);
    }
}
