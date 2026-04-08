import { Logger, Config, Application } from "@cmmv/core";
import { Repository } from "@cmmv/repository";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";

/**
 * PostUpdateWorker — daily worker that improves old posts for SEO.
 *
 * 1. Finds posts where needsSeoUpdate = true (limit 3 per cycle)
 * 2. Loads the top keyword from PostSeoMetrics (impressions > 100, position 8-25)
 * 3. Calls AI to rewrite title, content, metaTitle, metaDescription, slug
 * 4. Updates the post and clears the needsSeoUpdate flag
 */
export class PostUpdateWorker {
    private static readonly logger = new Logger("PostUpdateWorker");
    private static isRunning = false;

    async run(): Promise<void> {
        if (PostUpdateWorker.isRunning) {
            PostUpdateWorker.logger.log("[pipeline] postUpdateWorker already running, skipping");
            return;
        }

        PostUpdateWorker.isRunning = true;

        try {
            const PostsEntity = Repository.getEntity("PostsEntity");
            const PostSeoMetricsEntity = Repository.getEntity("PostSeoMetricsEntity");
            const language = Config.get<string>("blog.language", "pt-BR");

            PostUpdateWorker.logger.log("[pipeline] postUpdateWorker: Starting SEO update cycle");

            // 1. Find posts that need SEO updates
            const posts = await Repository.findAll(PostsEntity, {
                needsSeoUpdate: true,
                limit: 3,
                sortBy: "views",
                sort: "DESC",
            });

            if (!posts || posts.data.length === 0) {
                PostUpdateWorker.logger.log("[pipeline] postUpdateWorker: No posts need SEO update");
                return;
            }

            PostUpdateWorker.logger.log(`[pipeline] postUpdateWorker: Processing ${posts.data.length} posts`);

            const aiContentService: any = Application.resolveProvider(AIContentService);

            for (const post of posts.data) {
                try {
                    await this.updatePost(post, PostsEntity, PostSeoMetricsEntity, aiContentService, language);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    PostUpdateWorker.logger.error(
                        `[pipeline] postUpdateWorker: Failed to update post "${post.title}": ${msg}`
                    );
                    // Clear flag anyway to avoid infinite retry loops
                    try {
                        await Repository.updateOne(
                            PostsEntity,
                            Repository.queryBuilder({ id: post.id }),
                            { needsSeoUpdate: false }
                        );
                    } catch {}
                }
            }

            PostUpdateWorker.logger.log("[pipeline] postUpdateWorker: Cycle complete");
        } catch (error) {
            PostUpdateWorker.logger.error(
                `[pipeline] postUpdateWorker: Unexpected error: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            PostUpdateWorker.isRunning = false;
        }
    }

    private async updatePost(
        post: any,
        PostsEntity: any,
        PostSeoMetricsEntity: any,
        aiContentService: any,
        language: string,
    ): Promise<void> {
        // 2. Find the top keyword for this post (opportunity keyword)
        const metrics = await Repository.findAll(PostSeoMetricsEntity, {
            postId: post.id,
            sortBy: "impressions",
            sort: "DESC",
            limit: 10,
        });

        if (!metrics || metrics.data.length === 0) {
            PostUpdateWorker.logger.log(
                `[pipeline] postUpdateWorker: No metrics found for "${post.title}", clearing flag`
            );
            await Repository.updateOne(
                PostsEntity,
                Repository.queryBuilder({ id: post.id }),
                { needsSeoUpdate: false }
            );
            return;
        }

        // Find best opportunity keyword: impressions > 100 && position between 8-25
        const opportunityKeyword = metrics.data.find(
            (m: any) => m.impressions > 100 && m.position > 8 && m.position < 25
        );

        if (!opportunityKeyword) {
            PostUpdateWorker.logger.log(
                `[pipeline] postUpdateWorker: No opportunity keyword for "${post.title}", clearing flag`
            );
            await Repository.updateOne(
                PostsEntity,
                Repository.queryBuilder({ id: post.id }),
                { needsSeoUpdate: false }
            );
            return;
        }

        const targetKeyword = opportunityKeyword.keyword;
        PostUpdateWorker.logger.log(
            `[pipeline] postUpdateWorker: Improving "${post.title}" for keyword "${targetKeyword}" (pos: ${opportunityKeyword.position}, imp: ${opportunityKeyword.impressions})`
        );

        // 3. Call AI to improve the post
        const prompt = `Voce e um especialista em SEO para um site de eSports em ${language}.

Melhore este artigo para subir no Google para a keyword: "${targetKeyword}"

REGRAS:
- Mantenha o contexto e fatos originais
- Melhore o titulo para incluir a keyword naturalmente
- Adicione a keyword no primeiro paragrafo
- Melhore os subtitulos (h2) para variacoes da keyword
- NAO invente fatos novos — apenas reorganize e enriqueca
- NAO adicione conclusao
- O artigo deve parecer escrito por um jornalista de eSports

Artigo atual:
Titulo: ${post.title}
Conteudo: ${(post.content || "").substring(0, 3000)}

Retorne APENAS JSON valido, sem texto extra:
{
  "title": "novo titulo otimizado",
  "content": "conteudo HTML melhorado",
  "metaTitle": "<=60 chars com keyword",
  "metaDescription": "120-155 chars com keyword e CTA",
  "slug": "slug-otimizado-com-keyword"
}`;

        const response = await aiContentService.generateContent(prompt);

        if (!response) {
            throw new Error("No AI response for post update");
        }

        // Parse JSON from AI response
        let updated: {
            title: string;
            content: string;
            metaTitle: string;
            metaDescription: string;
            slug: string;
        };

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON object in response");
            updated = JSON.parse(jsonMatch[0]);
        } catch {
            throw new Error(`Failed to parse AI update response: ${response.substring(0, 200)}`);
        }

        // Validate the parsed result has required fields
        if (!updated.title || !updated.content) {
            throw new Error("AI response missing required fields (title, content)");
        }

        // 4. Update the post
        const updateData: Record<string, any> = {
            needsSeoUpdate: false,
        };

        if (updated.title && updated.title.length >= 3) {
            updateData.title = updated.title.substring(0, 100);
        }

        if (updated.content && updated.content.length > 50) {
            updateData.content = updated.content;
        }

        if (updated.metaTitle) {
            updateData.metaTitle = updated.metaTitle.substring(0, 60);
        }

        if (updated.metaDescription) {
            updateData.metaDescription = updated.metaDescription.substring(0, 160);
        }

        if (updated.slug) {
            updateData.slug = updated.slug
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
                .substring(0, 100);
        }

        await Repository.updateOne(
            PostsEntity,
            Repository.queryBuilder({ id: post.id }),
            updateData
        );

        // 5. Log what changed
        const changedFields = Object.keys(updateData).filter(k => k !== "needsSeoUpdate");
        PostUpdateWorker.logger.log(
            `[pipeline] postUpdateWorker: Updated "${post.title}" → keyword="${targetKeyword}", fields=[${changedFields.join(", ")}]`
        );
    }
}
