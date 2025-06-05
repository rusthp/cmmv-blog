import { Service, Application, Config, Logger } from "@cmmv/core";
import {
    Repository,
    MoreThanOrEqual
} from "@cmmv/repository";
//@ts-ignore
import { MediasService } from "@cmmv/blog";
//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";
import { CouponsServiceTools } from "../coupons/coupons.service";

interface AIJob {
    id: string;
    campaignId: string;
    type: 'seo' | 'content';
    status: 'pending' | 'processing' | 'completed' | 'error';
    result?: any;
    error?: string;
    startTime: Date;
}

@Service()
export class CampaignsServiceTools {
    private readonly logger = new Logger("CampaignsService");
    private aiJobs: Map<string, AIJob> = new Map();

    /**
     * Update the logo of a campaign
     * @param campaignId - The ID of the campaign
     * @param logo - The logo of the campaign as a base64 string
     * @returns The updated campaign
     */
    async updateCampaignLogo(campaignId: string, logo: string) {
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");

        const campaign = await Repository.findOne(CampaignEntity, {
            id: campaignId
        });

        if (!campaign)
            throw new Error("Campaign not found");

        const mediasService: any = Application.resolveProvider(MediasService);
        const logoUrl = await mediasService.getImageUrl(logo);

        const affectedRows = await Repository.update(CampaignEntity, campaignId, {
            logo: logoUrl
        });

        return { affected: affectedRows};
    }

    /**
     * Generate SEO content for a campaign using AI
     * @param campaignId - The ID of the campaign
     * @returns The generated SEO content
     */
    async generateSEOContent(campaignId: string) {
        const language = Config.get("blog.language", "en");
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");

        const campaign = await Repository.findOne(CampaignEntity, {
            id: campaignId
        });

        if (!campaign)
            throw new Error("Campaign not found");

        if (!campaign.domain)
            throw new Error("Campaign domain is required for SEO generation");

        try {
            const shortContentPrompt = `Generate SEO content for a coupon discount website for the store "${campaign.name}" (domain: ${campaign.domain}).

I need:
1. Title: An SEO optimized title (maximum 60 characters) focused on discount coupons
2. Subtitle: A catchy subtitle (maximum 120 characters)
3. SmallText: A short text (maximum 160-500 characters) for meta description

Focus on keywords like "discount coupon", "promotion", "offer", "savings" and the store name.

IMPORTANT: Respond in ${language} language.

Respond in JSON format:
{
  "title": "title here",
  "subtitle": "subtitle here",
  "smallText": "small text here"
}`;

            const longContentPrompt = `Write a detailed text about the store "${campaign.name}" (domain: ${campaign.domain}) for a discount coupon website.

The text should include:
- General information about the store
- Types of products/services offered
- How to use discount coupons in the store
- Tips for finding the best deals
- How to apply coupons at checkout
- Benefits of shopping at the store

Text should be 2000-4000 words, informative and SEO optimized.

IMPORTANT:
- Respond in ${language} language
- Format the response in HTML with Tailwind CSS 4 classes
- Do not include <html>, <head>, or <body> tags, just the content HTML
- Do not use container classes like max-w-*, mx-auto, or section wrappers
- Do not add links to external websites or third-party sites
- Do not use "Conclusão" or "Conclusion" as section titles or add footer content
- When mentioning coupons, do not reference third-party coupon sites (avoid phrases like "Sites parceiros como CupomValido.com.br" or similar)
- Focus only on the specific store and its own coupon system
- Use semantic HTML structure with headings and paragraphs styled with Tailwind CSS
- Use the following Tailwind CSS styling patterns:

Headers:
- h2: class="text-2xl font-bold text-gray-800 mb-4 mt-8"
- h3: class="text-xl font-semibold text-gray-700 mb-3 mt-6"
- h4: class="text-lg font-medium text-gray-600 mb-2 mt-4"

Paragraphs:
- p: class="text-gray-600 leading-relaxed mb-4"

Lists:
- ul: class="list-disc list-inside space-y-2 mb-4 text-gray-600 ml-6"
- ol: class="list-decimal list-inside space-y-2 mb-4 text-gray-600"
- li: class="leading-relaxed"

Emphasis:
- strong: class="font-semibold text-gray-800"
- em: class="italic text-gray-700"

Containers/Sections:
- Use divs with class="bg-gray-50 p-6 rounded-lg mb-6" for highlighted sections
- Use divs with class="border-l-4 border-green-500 pl-4 mb-4" for tips/highlights

Links (only for internal store references):
- a: class="text-green-600 hover:text-green-800 font-medium underline"

Example structure to follow (start directly with content, no wrapper sections):
<h2 class="text-2xl font-bold text-gray-800 mb-4 mt-8">Main Section</h2>
<p class="text-gray-600 leading-relaxed mb-4">Content paragraph...</p>
<div class="bg-gray-50 p-6 rounded-lg mb-6">
    <h3 class="text-xl font-semibold text-gray-700 mb-3">Important Information</h3>
    <p class="text-gray-600 leading-relaxed">Highlighted content...</p>
</div>
<ul class="list-disc list-inside space-y-2 mb-4 text-gray-600 ml-6">
    <li class="leading-relaxed">List item with details</li>
</ul>
<div class="border-l-4 border-green-500 pl-4 mb-4">
    <p class="text-gray-600 leading-relaxed"><strong class="font-semibold text-gray-800">Pro Tip:</strong> Important advice here</p>
</div>

Respond only with the HTML formatted text using Tailwind CSS classes, without JSON formatting and without container wrappers.`;

            const aiService = Application.resolveProvider<any>(AIContentService);

            const [shortContentResponse, longContentResponse] = await Promise.all([
                aiService.generateContent(shortContentPrompt),
                aiService.generateContent(longContentPrompt)
            ]);

            let shortContent;
            try {
                let jsonText = '';
                if (typeof shortContentResponse === 'string') {
                    const jsonStartIndex = shortContentResponse.indexOf('{');
                    const jsonEndIndex = shortContentResponse.lastIndexOf('}') + 1;

                    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex)
                        jsonText = shortContentResponse.substring(jsonStartIndex, jsonEndIndex);
                    else
                        jsonText = shortContentResponse;

                    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                } else {
                    jsonText = JSON.stringify(shortContentResponse);
                }

                shortContent = JSON.parse(jsonText);
            } catch (e) {
                shortContent = {
                    title: `Discount Coupons ${campaign.name} - Exclusive Offers`,
                    subtitle: `Save on your purchases at ${campaign.name} with our verified coupons`,
                    smallText: `Find the best discount coupons for ${campaign.name}. Exclusive offers and verified promotional codes.`
                };
            }

            let longContentText = '';

            if (typeof longContentResponse === 'string') {
                longContentText = longContentResponse.trim();
                longContentText = longContentText.replace(/```html\s*/g, '').replace(/```\s*$/g, '').trim();
            } else {
                longContentText = JSON.stringify(longContentResponse);
            }

            const seoMetadata = {
                seoTitle: shortContent.title,
                seoSubtitle: shortContent.subtitle,
                seoSmallText: shortContent.smallText,
                seoLongText: longContentText
            };

            let existingMetadata = {};
            if (campaign.metadata) {
                try {
                    existingMetadata = JSON.parse(campaign.metadata);
                } catch (e) {
                    existingMetadata = {};
                }
            }

            const updatedMetadata = {
                ...existingMetadata,
                ...seoMetadata
            };

            await Repository.update(CampaignEntity, campaignId, {
                metadata: JSON.stringify(updatedMetadata)
            });

            return {
                success: true,
                seoContent: seoMetadata
            };

        } catch (error: any) {
            throw new Error(`Failed to generate SEO content: ${error.message}`);
        }
    }

    /**
     * Start an asynchronous AI SEO content generation job
     * @param campaignId The ID of the campaign
     * @returns Job ID for tracking the processing status
     */
    async startSEOGenerationJob(campaignId: string): Promise<string> {
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const campaign = await Repository.findOne(CampaignEntity, { id: campaignId });

        if (!campaign)
            throw new Error(`Campaign with ID ${campaignId} not found`);

        if (!campaign.domain)
            throw new Error("Campaign domain is required for SEO generation");

        const jobId = `seo-job-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

        const job: AIJob = {
            id: jobId,
            campaignId: campaignId,
            type: 'seo',
            status: 'pending',
            startTime: new Date()
        };

        this.aiJobs.set(jobId, job);
        setTimeout(() => this.processSEOJob(jobId), 0);

        return jobId;
    }

    /**
     * Process an SEO generation job asynchronously
     * @param jobId The ID of the job to process
     */
    private async processSEOJob(jobId: string): Promise<void> {
        const job = this.aiJobs.get(jobId);
        if (!job) {
            this.logger.error(`Job ${jobId} not found`);
            return;
        }

        try {
            job.status = 'processing';
            this.aiJobs.set(jobId, job);

            const language = Config.get("blog.language", "en");
            const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");

            const campaign = await Repository.findOne(CampaignEntity, {
                id: job.campaignId
            });

            if (!campaign)
                throw new Error(`Campaign with ID ${job.campaignId} not found`);

            const shortContentPrompt = `Generate SEO content for a coupon discount website for the store "${campaign.name}" (domain: ${campaign.domain}).

I need:
1. Title: An SEO optimized title (maximum 60 characters) focused on discount coupons
2. Subtitle: A catchy subtitle (maximum 120 characters)
3. SmallText: A short text (maximum 160-500 characters) for meta description

Focus on keywords like "discount coupon", "promotion", "offer", "savings" and the store name.

IMPORTANT: Respond in ${language} language.

Respond in JSON format:
{
  "title": "title here",
  "subtitle": "subtitle here",
  "smallText": "small text here"
}`;

            const longContentPrompt = `Write a detailed text about the store "${campaign.name}" (domain: ${campaign.domain}) for a discount coupon website.

The text should include:
- General information about the store
- Types of products/services offered
- How to use discount coupons in the store
- Tips for finding the best deals
- How to apply coupons at checkout
- Benefits of shopping at the store

Text should be 2000-4000 words, informative and SEO optimized.

IMPORTANT:
- Respond in ${language} language
- Format the response in HTML with Tailwind CSS 4 classes
- Do not include <html>, <head>, or <body> tags, just the content HTML
- Do not use container classes like max-w-*, mx-auto, or section wrappers
- Do not add links to external websites or third-party sites
- Do not use "Conclusão" or "Conclusion" as section titles or add footer content
- When mentioning coupons, do not reference third-party coupon sites (avoid phrases like "Sites parceiros como CupomValido.com.br" or similar)
- Focus only on the specific store and its own coupon system
- Use semantic HTML structure with headings and paragraphs styled with Tailwind CSS
- Use the following Tailwind CSS styling patterns:

Headers:
- h2: class="text-2xl font-bold text-gray-800 mb-4 mt-8"
- h3: class="text-xl font-semibold text-gray-700 mb-3 mt-6"
- h4: class="text-lg font-medium text-gray-600 mb-2 mt-4"

Paragraphs:
- p: class="text-gray-600 leading-relaxed mb-4"

Lists:
- ul: class="list-disc list-inside space-y-2 mb-4 text-gray-600 ml-6"
- ol: class="list-decimal list-inside space-y-2 mb-4 text-gray-600"
- li: class="leading-relaxed"

Emphasis:
- strong: class="font-semibold text-gray-800"
- em: class="italic text-gray-700"

Containers/Sections:
- Use divs with class="bg-gray-50 p-6 rounded-lg mb-6" for highlighted sections
- Use divs with class="border-l-4 border-green-500 pl-4 mb-4" for tips/highlights

Links (only for internal store references):
- a: class="text-green-600 hover:text-green-800 font-medium underline"

Example structure to follow (start directly with content, no wrapper sections):
<h2 class="text-2xl font-bold text-gray-800 mb-4 mt-8">Main Section</h2>
<p class="text-gray-600 leading-relaxed mb-4">Content paragraph...</p>
<div class="bg-gray-50 p-6 rounded-lg mb-6">
    <h3 class="text-xl font-semibold text-gray-700 mb-3">Important Information</h3>
    <p class="text-gray-600 leading-relaxed">Highlighted content...</p>
</div>
<ul class="list-disc list-inside space-y-2 mb-4 text-gray-600 ml-6">
    <li class="leading-relaxed">List item with details</li>
</ul>
<div class="border-l-4 border-green-500 pl-4 mb-4">
    <p class="text-gray-600 leading-relaxed"><strong class="font-semibold text-gray-800">Pro Tip:</strong> Important advice here</p>
</div>

Respond only with the HTML formatted text using Tailwind CSS classes, without JSON formatting and without container wrappers.`;

            this.logger.log(`Processing SEO job ${jobId} for campaign ${job.campaignId}`);
            const aiService = Application.resolveProvider<any>(AIContentService);

            const [shortContentResponse, longContentResponse] = await Promise.all([
                aiService.generateContent(shortContentPrompt),
                aiService.generateContent(longContentPrompt)
            ]);

            let shortContent;
            try {
                let jsonText = '';
                if (typeof shortContentResponse === 'string') {
                    const jsonStartIndex = shortContentResponse.indexOf('{');
                    const jsonEndIndex = shortContentResponse.lastIndexOf('}') + 1;

                    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex)
                        jsonText = shortContentResponse.substring(jsonStartIndex, jsonEndIndex);
                    else
                        jsonText = shortContentResponse;

                    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                } else {
                    jsonText = JSON.stringify(shortContentResponse);
                }

                shortContent = JSON.parse(jsonText);
            } catch (e) {
                shortContent = {
                    title: `Discount Coupons ${campaign.name} - Exclusive Offers`,
                    subtitle: `Save on your purchases at ${campaign.name} with our verified coupons`,
                    smallText: `Find the best discount coupons for ${campaign.name}. Exclusive offers and verified promotional codes.`
                };
            }

            let longContentText = '';
            if (typeof longContentResponse === 'string') {
                longContentText = longContentResponse.trim();
                longContentText = longContentText.replace(/```html\s*/g, '').replace(/```\s*$/g, '').trim();
            } else {
                longContentText = JSON.stringify(longContentResponse);
            }

            const seoMetadata = {
                seoTitle: shortContent.title,
                seoSubtitle: shortContent.subtitle,
                seoSmallText: shortContent.smallText,
                seoLongText: longContentText
            };

            let existingMetadata = {};
            if (campaign.metadata) {
                try {
                    existingMetadata = JSON.parse(campaign.metadata);
                } catch (e) {
                    existingMetadata = {};
                }
            }

            const updatedMetadata = {
                ...existingMetadata,
                ...seoMetadata
            };

            await Repository.update(CampaignEntity, job.campaignId, {
                metadata: JSON.stringify(updatedMetadata)
            });

            const result = {
                success: true,
                seoContent: seoMetadata
            };

            job.result = result;
            job.status = 'completed';
            this.aiJobs.set(jobId, job);

            this.logger.log(`SEO job ${jobId} completed successfully`);

        } catch (error: any) {
            this.logger.error(`Error processing SEO job ${jobId}: ${error.message}`);
            job.status = 'error';
            job.error = error.message;
            this.aiJobs.set(jobId, job);
        }
    }

    /**
     * Get the status and result of an AI job
     * @param jobId The ID of the job to check
     * @returns The current status and result (if available) of the job
     */
    async getAIJobStatus(jobId: string) {
        const job = this.aiJobs.get(jobId);

        if (!job)
            throw new Error(`Job ${jobId} not found`);

        this.cleanupOldJobs();

        if (job.status === 'completed') {
            return {
                status: job.status,
                result: job.result
            };
        } else if (job.status === 'error') {
            return {
                status: job.status,
                error: job.error
            };
        } else {
            return {
                status: job.status
            };
        }
    }

    /**
     * Clean up old completed/error jobs to prevent memory leaks
     */
    private cleanupOldJobs() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        for (const [jobId, job] of this.aiJobs.entries()) {
            if ((job.status === 'completed' || job.status === 'error') && job.startTime < oneHourAgo)
                this.aiJobs.delete(jobId);
        }
    }

    /**
     * Get the list of campaigns that are public
     * @returns The list of campaigns
     */
    async getCampaignsPublicList(){
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const campaigns = await Repository.findAll(CampaignEntity, {
            active: true,
            limit: 10000
        }, [], {
            select: [
                "id", "name", "logo", "description", "highlight", "slug",
                "seoTitle", "seoSubtitle", "seoSmallText", "seoLongText"
            ]
        });

        return (campaigns && campaigns.data.length > 0) ? campaigns?.data : [];
    }

    /**
     * Get the list of campaigns that are public with their active coupon counts
     * @returns The list of campaigns with coupon counts
     */
    async getCampaignsPublicListWithCouponCounts() {
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const campaignsResult = await Repository.findAll(CampaignEntity, {
            active: true,
            limit: 10000
        }, [], {
            order: {
                highlight: "DESC"
            },
            select: [
                "id", "name", "logo", "highlight", "slug"
            ]
        });

        if (!campaignsResult || campaignsResult.data.length === 0)
            return [];

        const couponsService = Application.resolveProvider(CouponsServiceTools);
        const campaignsWithCounts = [];

        for (const campaign of campaignsResult.data) {
            try {
                const couponCountResponse = await couponsService.getCouponsCountByCampaignId(campaign.id);
                campaignsWithCounts.push({
                    ...campaign,
                    couponCount: couponCountResponse?.count || 0
                });
            } catch (err) {
                campaignsWithCounts.push({
                    ...campaign,
                    couponCount: 0
                });
            }
        }

        campaignsWithCounts.sort((a, b) => {
            const aIsHighlighted = !!a.highlight;
            const bIsHighlighted = !!b.highlight;

            if (aIsHighlighted && !bIsHighlighted) return -1;
            if (!aIsHighlighted && bIsHighlighted) return 1;

            const aCoupons = Number(a.couponCount || 0);
            const bCoupons = Number(b.couponCount || 0);

            if (bCoupons !== aCoupons)
                return bCoupons - aCoupons;

            return (a.name || "").localeCompare(b.name || "");
        });

        return campaignsWithCounts;
    }

    /**
     * Get a campaign by its slug
     * @param slug The slug of the campaign
     * @returns The campaign
     */
    async getCampaignBySlug(slug: string) {
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const AffiliateCouponsEntity = Repository.getEntity("AffiliateCouponsEntity");
        const campaign = await Repository.findOne(CampaignEntity, {
            slug,
            active: true
        });

        if (!campaign)
            throw new Error(`Campaign with slug ${slug} not found`);

        const coupons = await Repository.findAll(AffiliateCouponsEntity, {
            campaign: campaign.id,
            active: true,
            expiration: MoreThanOrEqual(new Date(Date.now() - 60 * 60 * 24 * 60 * 1000)),
            limit: 100
        }, [], {
            order: {
                expiration: "DESC"
            },
            select: [
                "type", "typeDiscount", "title", "description",
                "code", "expiration", "deeplink", "views"
            ]
        });

        return {
            id: campaign.id,
            name: campaign.name,
            logo: campaign.logo,
            description: campaign.description,
            seoTitle: campaign.seoTitle,
            seoSubtitle: campaign.seoSubtitle,
            seoSmallText: campaign.seoSmallText,
            seoLongText: campaign.seoLongText,
            coupons: coupons?.data || []
        };
    }

    /**
     * Search for campaigns by name
     * @param query The query to search for
     * @returns The campaigns that match the query
     */
    async searchCampaigns(query: string) {
        const AffiliateCampaignsEntity = Repository.getEntity("AffiliateCampaignsEntity");

        const campaignsResult = await Repository.findAll(AffiliateCampaignsEntity, {
            search: query,
            searchField: "name",
            active: true,
            limit: 10,
        }, [], {
            select: [
                "id", "name", "logo", "slug"
            ]
        });

        if (!campaignsResult || campaignsResult.data.length === 0)
            return [];

        const couponsService = Application.resolveProvider(CouponsServiceTools);
        const campaignsWithCounts = [];

        for (const campaign of campaignsResult.data) {
            try {
                const couponCountResponse = await couponsService.getCouponsCountByCampaignId(campaign.id);
                campaignsWithCounts.push({
                    ...campaign,
                    couponCount: couponCountResponse?.count || 0
                });
            } catch (err) {
                campaignsWithCounts.push({
                    ...campaign,
                    couponCount: 0
                });
            }
        }

        return campaignsWithCounts;
    }

    /**
     * Export the campaigns
     * @returns The campaigns
     */
    async export(){
        const CampaignEntity = Repository.getEntity("AffiliateCampaignsEntity");
        const campaigns = await Repository.findAll(CampaignEntity, { limit: 1000000 });
        return (campaigns && campaigns.data.length > 0) ? JSON.stringify(campaigns.data, null, 4) : "";
    }
}
