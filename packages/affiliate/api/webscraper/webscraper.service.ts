import {
    Service, Application, Config, Logger
} from "@cmmv/core";

import {
    Repository
} from "@cmmv/repository";

//@ts-ignore
import { AIContentService } from "@cmmv/ai-content";

export interface WebscraperAnalysisResult {
    success: boolean;
    fields: Array<{
        name: string;
        regex: string;
        description?: string;
    }>;
    error?: string;
    extractedData?: Array<any>;
    testResults?: any;
}

@Service()
export class WebscraperServiceTools {
    private readonly logger = new Logger("WebscraperService");

    /**
     * Analyze a URL and generate field extraction patterns using AI
     * @param url - The URL to analyze
     * @param type - The type of content to extract ('coupon' or 'product')
     * @returns Analysis result with suggested fields and regex patterns
     */
    async analyzeUrlForExtraction(url: string, type: 'coupon' | 'product'): Promise<WebscraperAnalysisResult> {
        try {
            this.logger.log(`Starting URL analysis for ${url} with type: ${type}`);

            if (!url)
                throw new Error('URL is required');

            if (!this.isValidUrl(url))
                throw new Error('Invalid URL provided');

            if (!type)
                throw new Error('Type is required (coupon or product)');

            if (!['coupon', 'product'].includes(type))
                throw new Error('Type must be either "coupon" or "product"');

            const htmlContent = await this.fetchWebpageContent(url);

            if (!htmlContent)
                throw new Error('Failed to fetch webpage content');

            const analysisResult = await this.generateAIAnalysis(htmlContent, url, type);

            this.logger.log(`URL analysis completed successfully for ${url}`);
            return analysisResult;

        } catch (error: any) {
            this.logger.error(`Error analyzing URL ${url}: ${error.message}`);
            return {
                success: false,
                fields: [],
                error: error.message
            };
        }
    }

    /**
     * Fetch webpage content from URL
     * @param url - The URL to fetch
     * @returns HTML content of the webpage
     */
    async fetchWebpageContent(url: string): Promise<string> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok)
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            const content = await response.text();
            const maxContentLength = 50000;

            if (content.length > maxContentLength)
                return content.substring(0, maxContentLength) + '...';

            return content;

        } catch (error: any) {
            this.logger.error(`Error fetching webpage content: ${error.message}`);
            throw new Error(`Failed to fetch webpage: ${error.message}`);
        }
    }

    /**
     * Generate AI analysis for field extraction
     * @param htmlContent - The HTML content to analyze
     * @param url - The original URL
     * @param type - The type of content ('coupon' or 'product')
     * @returns Analysis result with fields and regex patterns
     */
    private async generateAIAnalysis(htmlContent: string, url: string, type: 'coupon' | 'product'): Promise<WebscraperAnalysisResult> {
        try {
            const language = Config.get("blog.language", "en");
            const aiService = Application.resolveProvider<any>(AIContentService);

            let prompt = '';
            let expectedFields: string[] = [];

                                    if (type === 'coupon') {
                expectedFields = ['title', 'description', 'expiration', 'couponCode', 'discount', 'terms'];

                const couponPrompts = {
                    'pt': `ANÁLISE CRÍTICA DE CUPONS - URL: ${url}

OBJETIVO: Extrair dados INDIVIDUAIS de cada cupom de uma página que lista múltiplos cupons.

ANÁLISE DO HTML:
${htmlContent}

INSTRUÇÕES CRÍTICAS:

1. IDENTIFIQUE A ESTRUTURA REPETITIVA:
   - Procure por elementos que se repetem (li, div, article, etc.)
   - Cada repetição = 1 cupom individual
   - Ignore título da página, navegação, rodapé
   - Foque APENAS no conteúdo principal onde estão os cupons

2. PADRÕES COMUNS DE CUPONS:
   - <li class="coupon-item"> ou similar
   - <div class="offer"> ou <div class="deal">
   - <article class="coupon"> ou similar
   - Containers com classes: coupon, offer, deal, promo, discount

3. CÓDIGOS DE CUPOM (PRIORIDADE MÁXIMA):
   - Procure por códigos alfanuméricos (ex: SAVE20, DISCOUNT10, FREE50)
   - Geralmente em: <span class="code">, <button>, <div class="coupon-code">
   - Classes comuns: code, coupon-code, promo-code, item-code, discount-code
   - Podem estar em atributos data-code, data-coupon
   - NUNCA capture título da página como código

4. TÍTULO DO CUPOM (NÃO DA PÁGINA):
   - Título específico de cada cupom individual
   - Geralmente em h3, h4, span, div dentro do container do cupom
   - Classes: title, name, offer-title, coupon-title
   - NUNCA capture o <title> da página ou <h1> principal

5. OUTROS CAMPOS:
   - discount: Valores como "20% OFF", "$10 OFF", "50% de desconto"
   - expiration: Datas de validade
   - description: Descrição específica do cupom
   - terms: Termos e condições

EXEMPLO DE ANÁLISE CORRETA:
Se o HTML tem:
<ul class="coupon-list">
  <li class="coupon-item">
    <h3 class="coupon-title">Desconto em Roupas</h3>
    <span class="code">ROUPA20</span>
    <div class="discount">20% OFF</div>
  </li>
  <li class="coupon-item">
    <h3 class="coupon-title">Frete Grátis</h3>
    <span class="code">FRETEGRATIS</span>
    <div class="discount">Frete Grátis</div>
  </li>
</ul>

REGEX CORRETOS seriam:
- title: <h3 class="coupon-title">([^<]+)</h3>
- couponCode: <span class="code">([A-Z0-9]+)</span>
- discount: <div class="discount">([^<]+)</div>

RESPOSTA OBRIGATÓRIA EM JSON:
{
  "fields": [
    {
      "name": "title",
      "regex": "pattern_para_titulo_individual_do_cupom",
      "description": "Extrai o título específico de cada cupom"
    },
    {
      "name": "couponCode",
      "regex": "pattern_para_codigo_alfanumerico",
      "description": "Extrai o código do cupom (letras e números)"
    },
    {
      "name": "discount",
      "regex": "pattern_para_desconto",
      "description": "Extrai o valor do desconto"
    },
    {
      "name": "expiration",
      "regex": "pattern_para_data_validade",
      "description": "Extrai data de expiração"
    },
    {
      "name": "description",
      "regex": "pattern_para_descricao",
      "description": "Extrai descrição do cupom"
    },
    {
      "name": "terms",
      "regex": "pattern_para_termos",
      "description": "Extrai termos e condições"
    }
  ]
}

ATENÇÃO: Se não conseguir identificar códigos de cupom reais, deixe o regex vazio. Não invente padrões que não existem no HTML.`,

                    'en': `CRITICAL COUPON ANALYSIS - URL: ${url}

OBJECTIVE: Extract INDIVIDUAL data from each coupon on a page that lists multiple coupons.

HTML ANALYSIS:
${htmlContent}

CRITICAL INSTRUCTIONS:

1. IDENTIFY REPEATING STRUCTURE:
   - Look for repeating elements (li, div, article, etc.)
   - Each repetition = 1 individual coupon
   - Ignore page title, navigation, footer
   - Focus ONLY on main content where coupons are listed

2. COMMON COUPON PATTERNS:
   - <li class="coupon-item"> or similar
   - <div class="offer"> or <div class="deal">
   - <article class="coupon"> or similar
   - Containers with classes: coupon, offer, deal, promo, discount

3. COUPON CODES (MAXIMUM PRIORITY):
   - Look for alphanumeric codes (ex: SAVE20, DISCOUNT10, FREE50)
   - Usually in: <span class="code">, <button>, <div class="coupon-code">
   - Common classes: code, coupon-code, promo-code, item-code, discount-code
   - May be in attributes data-code, data-coupon
   - NEVER capture page title as code

4. COUPON TITLE (NOT PAGE TITLE):
   - Specific title of each individual coupon
   - Usually in h3, h4, span, div inside coupon container
   - Classes: title, name, offer-title, coupon-title
   - NEVER capture page <title> or main <h1>

5. OTHER FIELDS:
   - discount: Values like "20% OFF", "$10 OFF", "50% discount"
   - expiration: Expiration dates
   - description: Specific coupon description
   - terms: Terms and conditions

CORRECT ANALYSIS EXAMPLE:
If HTML has:
<ul class="coupon-list">
  <li class="coupon-item">
    <h3 class="coupon-title">Clothing Discount</h3>
    <span class="code">CLOTHES20</span>
    <div class="discount">20% OFF</div>
  </li>
  <li class="coupon-item">
    <h3 class="coupon-title">Free Shipping</h3>
    <span class="code">FREESHIP</span>
    <div class="discount">Free Shipping</div>
  </li>
</ul>

CORRECT REGEX would be:
- title: <h3 class="coupon-title">([^<]+)</h3>
- couponCode: <span class="code">([A-Z0-9]+)</span>
- discount: <div class="discount">([^<]+)</div>

MANDATORY JSON RESPONSE:
{
  "fields": [
    {
      "name": "title",
      "regex": "pattern_for_individual_coupon_title",
      "description": "Extracts specific title of each coupon"
    },
    {
      "name": "couponCode",
      "regex": "pattern_for_alphanumeric_code",
      "description": "Extracts coupon code (letters and numbers)"
    },
    {
      "name": "discount",
      "regex": "pattern_for_discount",
      "description": "Extracts discount value"
    },
    {
      "name": "expiration",
      "regex": "pattern_for_expiration_date",
      "description": "Extracts expiration date"
    },
    {
      "name": "description",
      "regex": "pattern_for_description",
      "description": "Extracts coupon description"
    },
    {
      "name": "terms",
      "regex": "pattern_for_terms",
      "description": "Extracts terms and conditions"
    }
  ]
}

WARNING: If you cannot identify real coupon codes, leave regex empty. Do not invent patterns that don't exist in HTML.`
                };

                prompt = couponPrompts[language as keyof typeof couponPrompts] || couponPrompts['en'];

                        } else if (type === 'product') {
                expectedFields = ['title', 'description', 'price', 'image', 'availability', 'brand', 'category', 'rating'];

                const productPrompts = {
                    'pt': `ANÁLISE CRÍTICA DE PRODUTOS - URL: ${url}

CONTEXTO: Esta pode ser uma página de listagem de produtos (múltiplos produtos) ou uma página de detalhes de produto único. Preciso extrair informações de produtos da área de conteúdo principal.

ÁREAS DE FOCO:
- Para páginas de listagem: Procure por estruturas repetitivas de produtos (como elementos <li>, <div>, <article>)
- Para páginas de detalhes: Foque na área principal de informações do produto
- Ignore header, navegação, rodapé, sidebar, seções de produtos relacionados
- Foque na área de conteúdo principal do produto
- Priorize elementos que contenham informações de preço (produtos devem ter preços)

ESTRATÉGIA DE EXTRAÇÃO:
1. Identifique se é uma lista de produtos ou página de produto único
2. Para listas: Encontre o padrão de container que contém produtos individuais
3. Para produto único: Encontre a área principal de informações do produto
4. Procure por nomes de classes comuns como: product, item, card, listing, detail
5. Preços geralmente estão em spans/divs com classes como: price, cost, amount, value

Campos esperados para extrair:
- title: Nome/título do produto (OBRIGATÓRIO)
- price: Preço do produto com moeda (OBRIGATÓRIO - extrair apenas se preço existir)
- image: URL da imagem principal do produto
- description: Descrição ou resumo do produto
- availability: Status de estoque (em estoque, fora de estoque, etc.)
- brand: Marca ou fabricante do produto
- category: Categoria ou tipo do produto
- rating: Avaliação ou pontuação do produto

Conteúdo HTML:
${htmlContent}

REGRAS IMPORTANTES:
- Crie padrões regex que correspondam ao conteúdo principal do produto, não anúncios ou recomendações
- Use grupos de captura () para extrair os valores reais
- Para preço: Procure por símbolos de moeda ($ € £ R$) seguidos de números
- Para imagens: Procure por atributos img src em containers de produtos
- Foque na área de conteúdo principal, ignore navegação/header/footer
- Se nenhuma estrutura clara de produto for encontrada, defina campos relevantes como string vazia
- Torne padrões flexíveis para corresponder a múltiplos produtos se for uma página de listagem
- Considere dados estruturados (JSON-LD, microdata) para melhor extração

EXEMPLOS DE PADRÕES PARA PROCURAR:
- <div class="product-item">...<span class="price">R$ 29,99</span>...</div>
- <article class="product">...<h2 class="title">Nome do Produto</h2>...</article>
- <li class="item">...<img src="produto.jpg" class="image">...</li>

Responda em formato JSON:
{
  "fields": [
    {
      "name": "title",
      "regex": "padrao_regex_aqui",
      "description": "Descrição do que isso extrai"
    },
    {
      "name": "price",
      "regex": "padrao_regex_aqui",
      "description": "Descrição do que isso extrai"
    }
    // ... continue para todos os campos
  ]
}`,

                    'en': `CRITICAL PRODUCT ANALYSIS - URL: ${url}

CONTEXT: This could be either a product listing page (multiple products) or a single product detail page. I need to extract product information from the main content area.

FOCUS AREAS:
- For listing pages: Look for repeating product structures (like <li>, <div>, <article> elements)
- For detail pages: Focus on the main product information area
- Ignore header, navigation, footer, sidebar, related products sections
- Focus on the primary product content area
- Prioritize elements that contain price information (as products must have prices)

EXTRACTION STRATEGY:
1. Identify if this is a product list or single product page
2. For lists: Find the container pattern that holds individual products
3. For single product: Find the main product information area
4. Look for common class names like: product, item, card, listing, detail
5. Prices are usually in spans/divs with classes like: price, cost, amount, value

Expected fields to extract:
- title: The product name/title (REQUIRED)
- price: Product price with currency (REQUIRED - only extract if price exists)
- image: Main product image URL
- description: Product description or summary
- availability: Stock status (in stock, out of stock, etc.)
- brand: Product brand or manufacturer
- category: Product category or type
- rating: Product rating or review score

HTML Content:
${htmlContent}

IMPORTANT RULES:
- Create regex patterns that match the main product content, not ads or recommendations
- Use capturing groups () to extract the actual values
- For price: Look for currency symbols ($ € £ R$) followed by numbers
- For images: Look for img src attributes in product containers
- Focus on the main content area, ignore navigation/header/footer
- If no clear product structure is found, set relevant fields as empty string
- Make patterns flexible to match multiple products if it's a listing page
- Consider structured data (JSON-LD, microdata) for better extraction

EXAMPLE PATTERNS TO LOOK FOR:
- <div class="product-item">...<span class="price">$29.99</span>...</div>
- <article class="product">...<h2 class="title">Product Name</h2>...</article>
- <li class="item">...<img src="product.jpg" class="image">...</li>

Respond in JSON format:
{
  "fields": [
    {
      "name": "title",
      "regex": "regex_pattern_here",
      "description": "Description of what this extracts"
    },
    {
      "name": "price",
      "regex": "regex_pattern_here",
      "description": "Description of what this extracts"
    }
    // ... continue for all fields
  ]
}`
                };

                prompt = productPrompts[language as keyof typeof productPrompts] || productPrompts['en'];
            }

            this.logger.log(`Generating AI analysis for ${type} extraction`);
            const aiResponse = await aiService.generateContent(prompt);

            // Parse AI response
            let analysisData;
            try {
                let jsonText = '';
                if (typeof aiResponse === 'string') {
                    // Extract JSON from response
                    const jsonStartIndex = aiResponse.indexOf('{');
                    const jsonEndIndex = aiResponse.lastIndexOf('}') + 1;

                    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
                        jsonText = aiResponse.substring(jsonStartIndex, jsonEndIndex);
                    } else {
                        jsonText = aiResponse;
                    }

                    // Clean up JSON formatting
                    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                } else {
                    jsonText = JSON.stringify(aiResponse);
                }

                analysisData = JSON.parse(jsonText);
            } catch (parseError) {
                this.logger.error(`Error parsing AI response: ${parseError}`);
                // Fallback with default fields
                analysisData = {
                    fields: expectedFields.map(fieldName => ({
                        name: fieldName,
                        regex: '',
                        description: `${fieldName} field (AI analysis failed)`
                    }))
                };
            }

            // Validate and format response
            const fields = Array.isArray(analysisData.fields) ? analysisData.fields : [];
            const validatedFields = fields.map((field: any) => ({
                name: field.name || '',
                regex: field.regex || '',
                description: field.description || `${field.name} extraction pattern`
            })).filter((field: any) => field.name.trim() !== '');

            // Step 2: Test the generated regex patterns and refine them
            this.logger.log(`Testing and refining regex patterns for ${type} extraction`);
            const refinedResult = await this.refineRegexWithAI(htmlContent, url, type, validatedFields, language, aiService);

            return refinedResult;

        } catch (error: any) {
            this.logger.error(`Error in AI analysis: ${error.message}`);
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    /**
     * Refine regex patterns using AI feedback after testing
     * @param htmlContent - The HTML content to test against
     * @param url - The original URL
     * @param type - The content type
     * @param initialFields - The initial regex patterns from first AI analysis
     * @param language - The language for responses
     * @param aiService - The AI service instance
     * @returns Refined analysis result with improved patterns and extracted data
     */
    private async refineRegexWithAI(
        htmlContent: string,
        url: string,
        type: 'coupon' | 'product',
        initialFields: Array<{name: string, regex: string, description: string}>,
        language: string,
        aiService: any
    ): Promise<WebscraperAnalysisResult> {
        try {
            // Test the initial regex patterns
            const testResults = await this.testRegexPatterns(htmlContent, initialFields);

            // Prepare test results summary for AI
            const testSummary = Object.entries(testResults).map(([fieldName, result]: [string, any]) => {
                if (result.success && result.matches.length > 0) {
                    const sampleMatches = result.matches.slice(0, 3).map((match: any) =>
                        match.groups[0] || match.fullMatch
                    );
                    return {
                        field: fieldName,
                        status: 'success',
                        matchCount: result.count,
                        samples: sampleMatches
                    };
                } else {
                    return {
                        field: fieldName,
                        status: 'failed',
                        error: result.error || 'No matches found',
                        matchCount: 0,
                        samples: []
                    };
                }
            });

                        // Create refinement prompt
            const couponRefinementPrompts = {
                'pt': `REFINAMENTO CRÍTICO DE REGEX PARA CUPONS - ${url}`,
                'en': `CRITICAL REGEX REFINEMENT FOR COUPONS - ${url}`
            };

            const productRefinementPrompts = {
                'pt': `REFINAMENTO CRÍTICO DE REGEX PARA PRODUTOS - ${url}`,
                'en': `CRITICAL REGEX REFINEMENT FOR PRODUCTS - ${url}`
            };

                        const couponRefinementContent = {
                'pt': `

RESULTADOS DOS TESTES INICIAIS:
${testSummary.map(result => `
Campo: ${result.field}
Status: ${result.status}
Matches: ${result.matchCount}
${result.status === 'success' ? `Amostras extraídas: ${result.samples.join(', ')}` : `Erro: ${result.error}`}
`).join('\n')}

PADRÕES ORIGINAIS:
${initialFields.map(field => `${field.name}: ${field.regex}`).join('\n')}

HTML PARA ANÁLISE:
${htmlContent.substring(0, 25000)}...

PROBLEMAS IDENTIFICADOS E CORREÇÕES NECESSÁRIAS:

1. ANÁLISE DOS RESULTADOS:
   - Se "title" capturou título da página (não do cupom individual): CORRIGIR
   - Se "couponCode" não encontrou códigos: PROCURAR MELHOR
   - Se extraiu HTML tags: LIMPAR PADRÕES
   - Se não encontrou estrutura repetitiva: REIDENTIFICAR

2. FOQUE EM CUPONS INDIVIDUAIS:
   - Cada cupom = 1 entrada no extractedData
   - Ignore navegação, header, footer, sidebar
   - Procure por listas, grids, cards de cupons
   - Identifique o container que se repete

3. CÓDIGOS DE CUPOM (CRÍTICO):
   - Procure por padrões como: SAVE20, DISCOUNT10, FREE50, CUPOM2024
   - Locais comuns: <span>, <button>, <div>, <code>
   - Classes: code, coupon-code, promo-code, discount-code
   - Atributos: data-code, data-coupon, data-clipboard-text
   - Se não existir códigos reais, deixe regex vazio

4. TÍTULOS DE CUPOM (NÃO DA PÁGINA):
   - Título específico de cada oferta individual
   - Dentro do container do cupom
   - Tags: h3, h4, span, div com classes como title, name, offer-title

5. VALIDAÇÃO DOS DADOS:
   - Cada item em extractedData deve ser um cupom diferente
   - couponCode deve ser alfanumérico real (não texto descritivo)
   - title deve ser específico do cupom (não genérico da página)

RESPOSTA OBRIGATÓRIA:
{
  "fields": [
    {
      "name": "title",
      "regex": "pattern_melhorado_titulo_cupom",
      "description": "Extrai título específico de cada cupom individual"
    },
    {
      "name": "couponCode",
      "regex": "pattern_melhorado_codigo_cupom",
      "description": "Extrai código alfanumérico do cupom"
    },
    {
      "name": "discount",
      "regex": "pattern_melhorado_desconto",
      "description": "Extrai valor do desconto"
    },
    {
      "name": "expiration",
      "regex": "pattern_melhorado_expiracao",
      "description": "Extrai data de validade"
    },
    {
      "name": "description",
      "regex": "pattern_melhorado_descricao",
      "description": "Extrai descrição do cupom"
    },
    {
      "name": "terms",
      "regex": "pattern_melhorado_termos",
      "description": "Extrai termos e condições"
    }
  ],
  "extractedData": [
    {
      "title": "Título específico do cupom 1",
      "couponCode": "CODIGO1",
      "discount": "20% OFF",
      "expiration": "31/12/2024",
      "description": "Descrição do cupom 1",
      "terms": "Termos do cupom 1"
    },
    {
      "title": "Título específico do cupom 2",
      "couponCode": "CODIGO2",
      "discount": "R$ 50 OFF",
      "expiration": "15/01/2025",
      "description": "Descrição do cupom 2",
      "terms": "Termos do cupom 2"
    }
  ]
}

ATENÇÃO: Se não conseguir extrair cupons individuais reais, retorne extractedData vazio. Não invente dados.`,

                'en': `

INITIAL TEST RESULTS:
${testSummary.map(result => `
Field: ${result.field}
Status: ${result.status}
Matches: ${result.matchCount}
${result.status === 'success' ? `Sample extractions: ${result.samples.join(', ')}` : `Error: ${result.error}`}
`).join('\n')}

ORIGINAL PATTERNS:
${initialFields.map(field => `${field.name}: ${field.regex}`).join('\n')}

HTML FOR ANALYSIS:
${htmlContent.substring(0, 25000)}...

IDENTIFIED PROBLEMS AND NECESSARY CORRECTIONS:

1. RESULTS ANALYSIS:
   - If "title" captured page title (not individual coupon): FIX
   - If "couponCode" didn't find codes: SEARCH BETTER
   - If extracted HTML tags: CLEAN PATTERNS
   - If didn't find repeating structure: RE-IDENTIFY

2. FOCUS ON INDIVIDUAL COUPONS:
   - Each coupon = 1 entry in extractedData
   - Ignore navigation, header, footer, sidebar
   - Look for lists, grids, coupon cards
   - Identify the repeating container

3. COUPON CODES (CRITICAL):
   - Look for patterns like: SAVE20, DISCOUNT10, FREE50, COUPON2024
   - Common locations: <span>, <button>, <div>, <code>
   - Classes: code, coupon-code, promo-code, discount-code
   - Attributes: data-code, data-coupon, data-clipboard-text
   - If no real codes exist, leave regex empty

4. COUPON TITLES (NOT PAGE TITLE):
   - Specific title of each individual offer
   - Inside coupon container
   - Tags: h3, h4, span, div with classes like title, name, offer-title

5. DATA VALIDATION:
   - Each item in extractedData must be a different coupon
   - couponCode must be real alphanumeric (not descriptive text)
   - title must be coupon-specific (not page generic)

MANDATORY RESPONSE:
{
  "fields": [
    {
      "name": "title",
      "regex": "improved_coupon_title_pattern",
      "description": "Extracts specific title of each individual coupon"
    },
    {
      "name": "couponCode",
      "regex": "improved_coupon_code_pattern",
      "description": "Extracts alphanumeric coupon code"
    },
    {
      "name": "discount",
      "regex": "improved_discount_pattern",
      "description": "Extracts discount value"
    },
    {
      "name": "expiration",
      "regex": "improved_expiration_pattern",
      "description": "Extracts expiration date"
    },
    {
      "name": "description",
      "regex": "improved_description_pattern",
      "description": "Extracts coupon description"
    },
    {
      "name": "terms",
      "regex": "improved_terms_pattern",
      "description": "Extracts terms and conditions"
    }
  ],
  "extractedData": [
    {
      "title": "Specific coupon title 1",
      "couponCode": "CODE1",
      "discount": "20% OFF",
      "expiration": "12/31/2024",
      "description": "Coupon 1 description",
      "terms": "Coupon 1 terms"
    },
    {
      "title": "Specific coupon title 2",
      "couponCode": "CODE2",
      "discount": "$50 OFF",
      "expiration": "01/15/2025",
      "description": "Coupon 2 description",
      "terms": "Coupon 2 terms"
    }
  ]
}

WARNING: If you cannot extract real individual coupons, return empty extractedData. Do not invent data.`
            };

            const refinementPrompt = type === 'coupon' ?
            `${couponRefinementPrompts[language as keyof typeof couponRefinementPrompts] || couponRefinementPrompts['en']}${couponRefinementContent[language as keyof typeof couponRefinementContent] || couponRefinementContent['en']}` :

            `${productRefinementPrompts[language as keyof typeof productRefinementPrompts] || productRefinementPrompts['en']}

${language === 'pt' ? `
RESULTADOS DOS TESTES INICIAIS:
${testSummary.map(result => `
Campo: ${result.field}
Status: ${result.status}
Matches: ${result.matchCount}
${result.status === 'success' ? `Amostras extraídas: ${result.samples.join(', ')}` : `Erro: ${result.error}`}
`).join('\n')}

PADRÕES ORIGINAIS:
${initialFields.map(field => `${field.name}: ${field.regex}`).join('\n')}

CONTEÚDO HTML (para referência):
${htmlContent.substring(0, 20000)}...

TAREFA DE REFINAMENTO:
Baseado nos resultados dos testes acima, melhore os padrões regex para:
1. Corrigir padrões que falharam ao corresponder (status: failed)
2. Melhorar padrões que corresponderam mas extraíram dados de baixa qualidade
3. Garantir que padrões capturem os dados mais relevantes e limpos
4. Tornar padrões mais específicos para evitar correspondências falsas
5. Focar na área de conteúdo principal e ignorar navegação/anúncios

REQUISITOS ESPECÍFICOS:
- Para produtos: Garantir que padrão de preço capture moeda e números corretamente
- Melhorar padrões que tiveram 0 correspondências
- Refinar padrões que extraíram tags HTML ou conteúdo irrelevante
- Tornar padrões mais precisos baseado na estrutura HTML real observada

Responda em formato JSON com padrões melhorados E os dados extraídos:
{
  "fields": [
    {
      "name": "nomeDoCampo",
      "regex": "padrao_regex_melhorado",
      "description": "O que este padrão melhorado extrai"
    }
  ],
  "extractedData": [
    {
      "title": "título extraído",
      "price": "preço extraído",
      "image": "imagem extraída"
      // ... outros campos baseados no tipo
    }
  ]
}

IMPORTANTE:
- Inclua array extractedData com dados reais encontrados usando os padrões melhorados
- Se um padrão ainda não puder ser melhorado, defina regex como string vazia
- Foque em qualidade sobre quantidade - melhor ter menos extrações precisas` : `
INITIAL ANALYSIS RESULTS:
${testSummary.map(result => `
Field: ${result.field}
Status: ${result.status}
Matches: ${result.matchCount}
${result.status === 'success' ? `Sample extractions: ${result.samples.join(', ')}` : `Error: ${result.error}`}
`).join('\n')}

ORIGINAL PATTERNS:
${initialFields.map(field => `${field.name}: ${field.regex}`).join('\n')}

HTML CONTENT (for reference):
${htmlContent.substring(0, 20000)}...

REFINEMENT TASK:
Based on the test results above, improve the regex patterns to:
1. Fix patterns that failed to match (status: failed)
2. Improve patterns that matched but extracted poor quality data
3. Ensure patterns capture the most relevant and clean data
4. Make patterns more specific to avoid false matches
5. Focus on the main content area and ignore navigation/ads

SPECIFIC REQUIREMENTS:
- For products: Ensure price pattern captures currency and numbers correctly
- Improve patterns that had 0 matches
- Refine patterns that extracted HTML tags or irrelevant content
- Make patterns more precise based on the actual HTML structure observed

Respond in JSON format with improved patterns AND the extracted data:
{
  "fields": [
    {
      "name": "fieldName",
      "regex": "improved_regex_pattern",
      "description": "What this improved pattern extracts"
    }
  ],
  "extractedData": [
    {
      "title": "extracted title",
      "price": "extracted price",
      "image": "extracted image"
      // ... other fields based on type
    }
  ]
}

IMPORTANT:
- Include extractedData array with actual data found using the improved patterns
- If a pattern still can't be improved, set regex as empty string
- Focus on quality over quantity - better to have fewer accurate extractions`}`;

            this.logger.log('Sending refinement request to AI');
            const refinementResponse = await aiService.generateContent(refinementPrompt);

            // Parse refinement response
            let refinementData;
            try {
                let jsonText = '';
                if (typeof refinementResponse === 'string') {
                    const jsonStartIndex = refinementResponse.indexOf('{');
                    const jsonEndIndex = refinementResponse.lastIndexOf('}') + 1;

                    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
                        jsonText = refinementResponse.substring(jsonStartIndex, jsonEndIndex);
                    } else {
                        jsonText = refinementResponse;
                    }

                    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
                } else {
                    jsonText = JSON.stringify(refinementResponse);
                }

                refinementData = JSON.parse(jsonText);
            } catch (parseError) {
                this.logger.error(`Error parsing refinement response: ${parseError}`);
                // Fallback to initial fields if refinement fails
                return {
                    success: true,
                    fields: initialFields,
                    extractedData: [],
                    testResults: testResults
                };
            }

            // Validate and format refined response
            const refinedFields = Array.isArray(refinementData.fields) ? refinementData.fields : initialFields;
            const extractedData = Array.isArray(refinementData.extractedData) ? refinementData.extractedData : [];

            const validatedRefinedFields = refinedFields.map((field: any) => ({
                name: field.name || '',
                regex: field.regex || '',
                description: field.description || `${field.name} extraction pattern`
            })).filter((field: any) => field.name.trim() !== '');

            this.logger.log(`Refinement completed. Extracted ${extractedData.length} items`);

            return {
                success: true,
                fields: validatedRefinedFields,
                extractedData: extractedData,
                testResults: testResults
            };

        } catch (error: any) {
            this.logger.error(`Error in regex refinement: ${error.message}`);
            // Fallback to initial fields if refinement fails
            return {
                success: true,
                fields: initialFields,
                extractedData: [],
                testResults: {}
            };
        }
    }

    /**
     * Validate if a string is a valid URL
     * @param url - The URL to validate
     * @returns True if valid URL
     */
    private isValidUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Test regex patterns against HTML content
     * @param htmlContent - The HTML content to test against
     * @param fields - Array of fields with regex patterns
     * @returns Test results showing what each regex extracts
     */
    async testRegexPatterns(htmlContent: string, fields: Array<{name: string, regex: string}>): Promise<any> {
        const results: any = {};

        for (const field of fields) {
            if (!field.regex || field.regex.trim() === '') {
                results[field.name] = {
                    success: false,
                    error: 'Empty regex pattern',
                    matches: []
                };
                continue;
            }

            try {
                const regex = new RegExp(field.regex, 'gi');
                const matches = [];
                let match;

                while ((match = regex.exec(htmlContent)) !== null) {
                    matches.push({
                        fullMatch: match[0],
                        groups: match.slice(1),
                        index: match.index
                    });

                    // Prevent infinite loop
                    if (matches.length >= 10) break;
                }

                results[field.name] = {
                    success: true,
                    matches: matches,
                    count: matches.length
                };

            } catch (error: any) {
                results[field.name] = {
                    success: false,
                    error: error.message,
                    matches: []
                };
            }
        }

        return results;
    }

    /**
     * Test regex patterns against HTML content from URL (controller wrapper)
     * @param url - The URL to fetch content from
     * @param fields - Array of fields with regex patterns
     * @returns Test results with success status
     */
    async testRegexPatternsFromUrl(url: string, fields: Array<{name: string, regex: string}>): Promise<any> {
        // Validate inputs
        if (!url) {
            throw new Error('URL is required');
        }

        if (!fields || !Array.isArray(fields)) {
            throw new Error('Fields array is required');
        }

        for (const field of fields) {
            if (!field.name || !field.regex) {
                throw new Error('Each field must have name and regex properties');
            }
        }

        // Fetch webpage content
        const htmlContent = await this.fetchWebpageContent(url);

        if (!htmlContent) {
            throw new Error('Failed to fetch webpage content');
        }

        // Test regex patterns
        const testResults = await this.testRegexPatterns(htmlContent, fields);

        return {
            success: true,
            url: url,
            results: testResults
        };
    }

    /**
     * Get webpage content preview (controller wrapper)
     * @param url - The URL to preview
     * @returns Preview data with metadata
     */
    async getWebpagePreview(url: string): Promise<any> {
        if (!url) {
            throw new Error('URL parameter is required');
        }

        const htmlContent = await this.fetchWebpageContent(url);

        if (!htmlContent) {
            throw new Error('Failed to fetch webpage content');
        }

        const previewLength = 5000;
        const preview = htmlContent.length > previewLength
            ? htmlContent.substring(0, previewLength) + '...'
            : htmlContent;

        return {
            success: true,
            url: url,
            contentLength: htmlContent.length,
            preview: preview,
            truncated: htmlContent.length > previewLength
        };
    }

    /**
     * Health check for the webscraper service
     * @returns Health status
     */
    async healthCheck(): Promise<any> {
        return {
            success: true,
            service: 'webscraper',
            status: 'healthy',
            timestamp: new Date().toISOString()
        };
    }
}
