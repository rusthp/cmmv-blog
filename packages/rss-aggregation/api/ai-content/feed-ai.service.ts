import { Service } from "@cmmv/core";
import { Repository, IsNull } from "@cmmv/repository";

@Service()
export class FeedAIService {
    /**
     * @returns The raw feed items
     */
    async get(queries: any) {
        const FeedAIContentEntity = Repository.getEntity("FeedAIContentEntity");
        
        const repoQueries = { ...queries };
        // URLSearchParams stringifies `null` as the string "null"
        if (repoQueries.postRef === 'null') {
            repoQueries.postRef = IsNull();
        }
        
        const response = await Repository.findAll(FeedAIContentEntity, repoQueries);
        return response;
    }

    async update(id: string, payload: any) {
        const FeedAIContentEntity = Repository.getEntity("FeedAIContentEntity");
        await Repository.update(FeedAIContentEntity, id, payload);
        return { success: true, id };
    }
} 