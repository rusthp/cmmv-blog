import {
    Service
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service()
export class NetworksService {
    /**
     * Export the networks
     */
    async export(){
        const AffiliateNetworksEntity = Repository.getEntity("AffiliateNetworksEntity");
        const networks = await Repository.findAll(AffiliateNetworksEntity, { limit: 1000000 });
        return (networks && networks.data.length > 0) ? JSON.stringify(networks.data, null, 4) : "";
    }
}
