import { Service, Config } from "@cmmv/core";

@Service()
export class GeminiService {
    async generateContent(prompt: string) : Promise<string> {
        const geminiApiKey = Config.get("blog.geminiApiKey");
        const timeout = Config.get("blog.aiTimeout", 90000); // 90 segundos por padrão

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-exp-03-25:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': geminiApiKey || ''
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8000
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to generate AI content: ${response.statusText}`);
            }

            const geminiResponse = await response.json();
            const generatedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText)
                throw new Error('No content generated by Gemini');

            return generatedText;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Gemini AI timeout after ${timeout}ms`);
            }
            
            throw error;
        }
    }
}