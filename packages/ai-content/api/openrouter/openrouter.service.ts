import { Service, Config } from "@cmmv/core";

@Service()
export class OpenRouterService {
    async generateContent(prompt: string): Promise<string> {
        const apiKey = Config.get("blog.openrouterApiKey");
        const model = Config.get("blog.openrouterModel", "meta-llama/llama-3.3-70b-instruct:free");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey || ""}`,
                "HTTP-Referer": "https://proplaynews.gg",
                "X-Title": "ProPlayNews"
            },
            body: JSON.stringify({
                model,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1,
                max_tokens: 8000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenRouter error: ${error}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text)
            throw new Error("No content from OpenRouter");

        return text;
    }
}
