import { Module } from '@cmmv/core';

import {
    NetworksService
} from "./networks.service";

import {
    NetworksController
} from "./networks.controller";

export const AffiliateNetworksModule = new Module('affiliate-networks', {
    providers: [NetworksService],
    controllers: [NetworksController]
});
