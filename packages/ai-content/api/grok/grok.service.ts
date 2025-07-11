import { Service, Config } from "@cmmv/core";

@Service()
export class GrokService {
    async generateContent(prompt: string) : Promise<string> {
        const grokApiKey = Config.get("blog.grokApiKey");
        const timeout = Config.get("blog.aiTimeout", 90000); // 90 segundos por padrão

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch('https://api.grok.x/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${grokApiKey || ''}`
                },
                body: JSON.stringify({
                    model: "grok-2",
                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 8000
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to generate AI content: ${response.statusText}`);
            }

            const grokResponse = await response.json();
            const generatedText = grokResponse.choices?.[0]?.message?.content;

            if (!generatedText)
                throw new Error('No content generated by Grok');

            return generatedText;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Grok AI timeout after ${timeout}ms`);
            }
            
            throw error;
        }
    }
}
