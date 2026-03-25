import { Service, Logger } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

@Service('blog_contact')
export class ContactService {
    private readonly logger = new Logger("ContactService");

    async createContact(data: {
        name: string;
        email: string;
        subject: string;
        message: string;
        ip?: string;
    }) {
        const ContactEntity = Repository.getEntity("ContactEntity");

        const contact = await Repository.insert(ContactEntity, {
            name: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
            status: 'new',
            ip: data.ip || null
        });

        this.logger.log(`New contact from ${data.email}: ${data.subject}`);
        return contact;
    }

    async getContacts(queries: any) {
        const ContactEntity = Repository.getEntity("ContactEntity");
        const limit = parseInt(queries.limit) || 20;
        const offset = parseInt(queries.offset) || 0;

        const filters: any = {};
        if (queries.status) filters.status = queries.status;

        const result = await Repository.findAll(ContactEntity, {
            ...filters,
            limit,
            offset
        });

        return result;
    }

    async updateStatus(id: string, status: string) {
        const ContactEntity = Repository.getEntity("ContactEntity");
        await Repository.updateOne(ContactEntity, Repository.queryBuilder({ id }), { status });
        return { result: true };
    }

    async deleteContact(id: string) {
        const ContactEntity = Repository.getEntity("ContactEntity");
        await Repository.delete(ContactEntity, { id });
        return { result: true };
    }
}
