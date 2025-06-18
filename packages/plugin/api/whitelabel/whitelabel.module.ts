import { Module } from '@cmmv/core';

import {
    WhitelabelContract,
    WhitelabelAccessContract
} from '../../contracts';

import { WhitelabelController } from './whitelabel.controller';
import { WhitelabelService } from "./whitelabel.service";

export const WhitelabelModule = new Module('whitelabel', {
    contracts: [WhitelabelContract, WhitelabelAccessContract],
    controllers: [WhitelabelController],
    providers: [WhitelabelService]
});
