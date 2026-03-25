import { Module } from '@cmmv/core';
import { ContactContract } from '../../contracts/contact.contract';
import { ContactPublicController, ContactAdminController } from './contact.controller';
import { ContactService } from './contact.service';

export const ContactModule = new Module('blog_contact', {
    controllers: [ContactPublicController, ContactAdminController],
    providers: [ContactService],
    contracts: [ContactContract]
});
