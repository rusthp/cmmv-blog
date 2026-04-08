import {
    Service, Config
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

@Service('blog_prompts')
export class PromptsServiceTools {

    private defaultPrompt: string = `2. Creating an SEO-optimized title that captures the essence of the content:
               - Keep it under 60 characters for the metaTitle (search result display)
               - The article display title can be up to 80 characters for better readability
               - Place the primary long-tail keyword near the beginning of the title
               - Be specific: include game name, patch number, date, player name, or event name when relevant
               - Examples for eSports: "CS2 April 2026 Update: Full Mirage Changes Explained" not "CS2 Gets New Update"
               - Examples for eSports: "LOUD vs FURIA VCT 2026: Match Results and Stats" not "LOUD Wins Match"
            3. Writing a comprehensive article that summarizes the key points and insights
            4. Adding context, background information, and your own analysis to enhance the content
            5. Preserving important links to sources and reference pages, but adding rel="noindex nofollow" attributes to all links
            6. Creating a well-structured HTML article using proper formatting:
               - Use <h2> tags for main sections (2-4 sections recommended)
               - Use <p> tags for paragraphs
               - Use <ul> and <li> tags for lists where appropriate
               - Include a concluding paragraph
               - For links, use: <a href="https://example.com" rel="noindex nofollow" target="_blank">text</a>
            7. Start with a strong introductory paragraph
            8. Suggesting 3-8 relevant tags for categorizing this content — tags should include:
               - The primary game or title (e.g., "CS2", "League of Legends", "Valorant")
               - The content type (e.g., "patch notes", "roster", "tournament", "guide", "tier list")
               - Key proper nouns from the article (team names, player names, event names)
               - Avoid generic tags like "gaming", "news", "esports" as standalone — combine them (e.g., "CS2 news", "LoL esports")
            9. Properly extract and handle all images from the content by following these rules:
                - ONLY use images that exist in the original post - DO NOT create or generate new images that don't exist
               - Extract the best quality image URL from image tags
               - For images with srcset attribute, choose the largest/highest resolution option
               - For WordPress images with data-src or data-srcset, use the src attribute value if available
               - When encountering relative image paths, convert them to absolute URLs using the provided base URL
               - Preserve alt text from original images
               - Format image tags like: <img src="https://example.com/image.jpg" alt="Description" loading="lazy" />
               - Do not include width and height attributes unless absolutely necessary
               - For each image, determine if it's the main/feature image of the article

            IMAGE EXTRACTION EXAMPLE:
            From a complex WordPress image tag like:
            <img decoding="async" src="https://example.com/image-1200x675.webp" alt="Description" data-src="https://example.com/image-1200x675.webp" data-srcset="https://example.com/image-1200x675.webp 1200w, https://example.com/image-640x360.webp 640w, https://example.com/image.webp 1280w" srcset="https://example.com/image-1200x675.webp 1200w, https://example.com/image.webp 1280w">

            Extract the highest resolution image URL (in this case: https://example.com/image.webp) and output:
            <img src="https://example.com/image.webp" alt="Description" loading="lazy" />

            IMPORTANT:
            - For titles, DO NOT default to number-based formats (like "5 Ways to..." or "10 Tips for...")
            - Only use numbered titles when the content specifically warrants it (such as step-by-step guides or ranked lists)
            - Prefer descriptive, narrative or question-based titles that engage readers without relying on numbers
            - Avoid sensationalist or clickbait headlines
            - IMPORTANT: AVOID clickbait phrases like "The Secret", "Discover", "You Won't Believe", "This Is Why", etc.
            - Focus on straightforward, informative titles that clearly communicate the article's value

            For titles, prioritize these natural headline formulas:

            1. The "How-To Formula":
            How to [Achieve Desired Outcome] without [Common Pain Point]

            Examples:
            - "How to Lose Weight While Still Enjoying Your Meals"
            - "How to Learn a New Language with Just 15 Minutes Daily"
            - "How to Begin Investing with Minimal Risk"

            2. The "Question Formula":
            [Straightforward Question That Promises an Answer]?

            Examples:
            - "What Should You Consider When Buying a New Smartphone?"
            - "Are These Skincare Habits Damaging Your Skin?"
            - "What Makes Homemade Pizza Better Than Takeout?"

            3. The "Practical Insight Formula":
            What [Experts/Experience] Teaches About [Topic]

            Examples:
            - "What Dermatologists Recommend for Healthy Skin"
            - "What Professional Bakers Know About Perfect Sourdough"
            - "What Travel Experience Reveals About Finding Affordable Flights"

            4. The "Why Formula":
            Why [Common Belief/Practice] May Not Work and What to Try Instead

            Examples:
            - "Why Traditional Dieting Often Doesn't Work Long-Term"
            - "Why Your Coffee Brewing Method Matters for Flavor"
            - "Why Home Security Goes Beyond Just Installing Cameras"

            5. The "Comparison Formula":
            [Product/Method A] vs [Product/Method B]: Choosing the Right Option for [Goal]

            Examples:
            - "Air Fryers vs Convection Ovens: Choosing the Right Kitchen Tool"
            - "Morning vs Evening Exercise: Fitting Workouts Into Your Schedule"
            - "Savings vs Investments: Building Your Financial Foundation"

            6. The "Straightforward Guide":
            A Practical Guide to [Topic] for [Target Audience]

            Examples:
            - "A Practical Guide to Home Automation for Beginners"
            - "A Realistic Approach to Personal Finance for Young Professionals"
            - "A Beginner's Handbook for Smartphone Photography"

            7. The "Helpful Advice Formula":
            Important Considerations About [Topic] You Should Know

            Examples:
            - "Important Password Security Practices Worth Implementing"
            - "Kitchen Habits That Can Help Reduce Your Grocery Budget"
            - "Skincare Ingredients That Might Not Be Right for Your Skin Type"

            8. The "Experience-Based Formula":
            What I Learned About [Topic] After [Time Period/Experience]

            Examples:
            - "What I Learned About Remote Work After Three Years"
            - "My Experience With Minimalism After Downsizing My Home"
            - "Insights From Growing My Own Vegetables For a Full Season"

            9. The "Informative Formula":
            [Topic]: Understanding [Key Aspect] for Better [Outcome]

            Examples:
            - "Bluetooth Speakers: Understanding Audio Quality for Better Outdoor Sound"
            - "Gaming Chairs: Evaluating Comfort Features for Long Sessions"
            - "Noise-Canceling Headphones: Comparing Technologies for Work-from-Home"

            IMPORTANT - MAKING TEXT HUMAN-LIKE:
            - DO NOT follow a rigid, predictable structure for all articles
            - Vary paragraph lengths considerably - mix very short (1-2 sentences) with medium and longer paragraphs
            - Insert occasional rhetorical questions to engage the reader
            - Include personal opinions or perspectives with phrases like "In my experience," or "I believe"
            - Use varied sentence structures - simple, compound, and complex sentences
            - Add occasional humor, metaphors, or analogies where appropriate
            - Include some conversational elements like contractions, colloquial phrases, or asking the reader questions
            - Randomize section lengths rather than making them all similar size
            - Sometimes break traditional writing rules (like starting with "And" or "But")
            - Vary transitions between paragraphs (don't always use the same connecting phrases)
            - Insert occasional first-person anecdotes or stories to illustrate points
            - Use asides or parenthetical comments to add personality
            - Vary vocabulary richness - mix simple terms with occasional technical or sophisticated language
            - Avoid overly perfect structures that sound AI-generated
            - Sometimes digress briefly before returning to the main point
            - Add occasional expressions of emotion ("I was surprised to learn that..." or "It's frustrating when...")
        `;

    /**
     * Get the default prompt
     * @returns The default prompt
     */
    async getDefaultPrompt(promptId: string){
        const promptsOverride = Config.get<boolean>("blog.promptsOverride", false);

        if(promptId){
            const prompt = await this.getPromptById(promptId);

            if(prompt)
                return prompt;
        }

        if(promptsOverride)
            return await this.getRandomPrompt(promptId);

        return this.defaultPrompt;
    }

    /**
     * Get a random prompt from the database
     * @returns A random prompt from the database
     */
    async getRandomPrompt(promptId: string){

        if(promptId){
            const prompt = await this.getPromptById(promptId);

            if(prompt)
                return prompt;
        }

        const PromptsEntity = Repository.getEntity("PromptsEntity");
        const promptsData = await Repository.findAll(PromptsEntity, {
            limit: 100
        }, [], {
            select: ["prompt", "relevance"]
        });

        let promts: string[] = [];

        if(promptsData){
            for(let promptItem of promptsData.data){
                for(let i = 0; i < promptItem.relevance; i++){
                    promts.push(promptItem.prompt);
                }
            }
        }

        return promts.length > 0 ? promts[Math.floor(Math.random() * promts.length)] : this.defaultPrompt;
    }

    /**
     * Get a prompt by ID
     * @param promptId The ID of the prompt
     * @returns The prompt
     */
    async getPromptById(promptId: string){
        const PromptsEntity = Repository.getEntity("PromptsEntity");
        const prompt = await Repository.findOne(PromptsEntity, {
            id: promptId
        });
        return prompt ? prompt.prompt : this.defaultPrompt;
    }
}
