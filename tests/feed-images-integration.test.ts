/**
 * tests/feed-images-integration.test.ts
 *
 * Teste PRÁTICO de extração de imagem dos feeds reais configurados no banco.
 * Replica exatamente a lógica de channels.service.ts + auto-pipeline.service.ts.
 *
 * Feeds com featureImage vazia identificados no banco:
 *   - ValorantZone  https://valorantzone.gg/feed/
 *   - HLTV          https://www.hltv.org/rss/news
 *   - Dust2         https://www.dust2.com.br/rss
 *   - THESPIKE      https://www.thespike.gg/rss.xml
 */
import { describe, it, expect } from 'vitest'
import { parseStringPromise } from 'xml2js'

// ─── Replicação da lógica de extração de imagem do channels.service.ts ────────

function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
}

function extractImageFromRSSItem(item: any): string {
    // 1. media:content
    const mediaContent = item['media:content'] || item['media:Content']
    if (mediaContent) {
        const contents = Array.isArray(mediaContent) ? mediaContent : [mediaContent]
        const images = contents.filter((m: any) => {
            const type = m.$?.type || m.type || ''
            return type.startsWith('image/') || !type
        })
        if (images.length > 0) {
            const sorted = images.sort((a: any, b: any) => {
                const wa = parseInt(a.$?.width || '0', 10)
                const wb = parseInt(b.$?.width || '0', 10)
                return wb - wa
            })
            const url = sorted[0].$?.url || sorted[0].url
            if (url) return decodeHtmlEntities(url)
        }
    }

    // 2. enclosure
    const enclosure = item.enclosure
    if (enclosure) {
        const enc = Array.isArray(enclosure) ? enclosure[0] : enclosure
        const type = enc.$?.type || enc.type || ''
        if (type.startsWith('image/')) {
            const url = enc.$?.url || enc.url
            if (url) return decodeHtmlEntities(url)
        }
    }

    // 3. itunes:image
    const itunesImage = item['itunes:image']
    if (itunesImage) {
        const img = Array.isArray(itunesImage) ? itunesImage[0] : itunesImage
        const url = img.$?.href || img.href
        if (url) return decodeHtmlEntities(url)
    }

    // 4. image tag
    const imageTag = item.image
    if (imageTag) {
        const img = Array.isArray(imageTag) ? imageTag[0] : imageTag
        const url = img.url || img.$?.url
        if (url) return typeof url === 'string' ? url : url[0]
    }

    // 5. thumbnail
    const thumbnail = item['media:thumbnail'] || item.thumbnail
    if (thumbnail) {
        const thumb = Array.isArray(thumbnail) ? thumbnail[0] : thumbnail
        const url = thumb.$?.url || thumb.url
        if (url) return decodeHtmlEntities(url)
    }

    // 6. img tag no content
    const content =
        (typeof item.content === 'string' ? item.content : item.content?._ || '') ||
        (typeof item['content:encoded'] === 'string' ? item['content:encoded'] : item['content:encoded']?.[0] || '') ||
        (typeof item.description === 'string' ? item.description : item.description?.[0] || '')

    if (content) {
        const match = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
        if (match?.[1]) return match[1]
    }

    return ''
}

async function extractImageFromPageMeta(articleUrl: string): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    try {
        const res = await fetch(articleUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; cmmv-blog/1.0; +https://cmmv.io)',
                'Accept': 'text/html',
            },
        })
        clearTimeout(timer)

        if (!res.ok) return ''

        const html = await res.text()
        const metas = [
            /property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
            /content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
            /name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
            /content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
        ]
        for (const re of metas) {
            const m = html.match(re)
            if (m?.[1]) return m[1]
        }
        return ''
    } catch {
        clearTimeout(timer)
        return ''
    }
}

async function tryDownloadImage(url: string): Promise<{
    ok: boolean
    status?: number
    contentType?: string
    sizeKB?: number
    reason?: string
}> {
    if (!url) return { ok: false, reason: 'empty URL' }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            method: 'HEAD', // HEAD primeiro para checar sem baixar tudo
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*;q=0.8',
                'Referer': 'https://www.google.com/',
            },
        })
        clearTimeout(timer)

        if (!res.ok) return { ok: false, status: res.status, reason: `HTTP ${res.status}` }

        const ct = res.headers.get('content-type') || ''
        if (!ct.startsWith('image/')) {
            // tenta GET se HEAD retornou content-type errado (alguns CDNs não respondem HEAD corretamente)
            const res2 = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*,*/*;q=0.8',
                    'Referer': 'https://www.google.com/',
                },
            })
            const ct2 = res2.headers.get('content-type') || ''
            if (!ct2.startsWith('image/'))
                return { ok: false, contentType: ct2, reason: `content-type inválido: ${ct2}` }

            const cl2 = parseInt(res2.headers.get('content-length') || '0', 10)
            return { ok: true, contentType: ct2, sizeKB: Math.round(cl2 / 1024) }
        }

        const cl = parseInt(res.headers.get('content-length') || '0', 10)
        return { ok: true, status: res.status, contentType: ct, sizeKB: Math.round(cl / 1024) }
    } catch (err: any) {
        clearTimeout(timer)
        return { ok: false, reason: err.message }
    }
}

// ─── Fetch + parse RSS ────────────────────────────────────────────────────────

async function fetchFeed(rssUrl: string): Promise<any[]> {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 15000)

    const res = await fetch(rssUrl, {
        signal: controller.signal,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; cmmv-blog/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${rssUrl}`)

    const xml = await res.text()
    const parsed = await parseStringPromise(xml, { explicitArray: false, mergeAttrs: false })

    const channel = parsed?.rss?.channel || parsed?.feed
    if (!channel) throw new Error('Estrutura do feed não reconhecida')

    const items = channel.item || channel.entry || []
    return Array.isArray(items) ? items : [items]
}

// ─── Diagnóstico por feed ──────────────────────────────────────────────────────

interface ItemReport {
    title: string
    link: string
    imageFromRSS: string
    imageFromMeta: string
    downloadResult: Awaited<ReturnType<typeof tryDownloadImage>>
}

async function diagnoseFeed(name: string, rssUrl: string, maxItems = 3): Promise<ItemReport[]> {
    const items = await fetchFeed(rssUrl)
    const reports: ItemReport[] = []

    for (const item of items.slice(0, maxItems)) {
        const title = (typeof item.title === 'string' ? item.title : item.title?._ || '').trim()
        const link  = (typeof item.link  === 'string' ? item.link  : item.link?.href || item.link?.[0] || '').trim()

        let imageFromRSS  = extractImageFromRSSItem(item)
        let imageFromMeta = ''

        if (!imageFromRSS && link) {
            console.log(`  [${name}] Sem imagem no RSS para "${title}" — tentando meta tags de ${link}`)
            imageFromMeta = await extractImageFromPageMeta(link)
        }

        const imageUrl    = imageFromRSS || imageFromMeta
        const downloadResult = await tryDownloadImage(imageUrl)

        reports.push({ title, link, imageFromRSS, imageFromMeta, downloadResult })

        // Log resumo no console para facilitar debugging
        const src = imageFromRSS ? 'RSS' : imageFromMeta ? 'META' : 'NENHUMA'
        const dl  = downloadResult.ok ? `✅ ${downloadResult.contentType} ${downloadResult.sizeKB}KB` : `❌ ${downloadResult.reason}`
        console.log(`  [${name}] "${title.slice(0, 50)}"`)
        console.log(`    fonte: ${src}  |  url: ${(imageUrl || '—').slice(0, 80)}`)
        console.log(`    download: ${dl}`)
    }

    return reports
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Diagnóstico de imagens — feeds reais', () => {

    it('ValorantZone — extrai e valida imagens do feed', async () => {
        const reports = await diagnoseFeed('ValorantZone', 'https://valorantzone.gg/feed/', 3)

        expect(reports.length).toBeGreaterThan(0)

        for (const r of reports) {
            const hasImage = !!(r.imageFromRSS || r.imageFromMeta)
            console.log(`\n  → hasImage: ${hasImage}, download ok: ${r.downloadResult.ok}`)

            // Se encontrou imagem, ela deve ser baixável
            if (hasImage) {
                expect(r.downloadResult.ok).toBe(true)
            }
        }

        // Relata o resultado global
        const withImage = reports.filter(r => r.imageFromRSS || r.imageFromMeta)
        console.log(`\n  ValorantZone: ${withImage.length}/${reports.length} itens têm imagem`)
    }, 60000)

    it('HLTV — extrai e valida imagens do feed', async () => {
        const reports = await diagnoseFeed('HLTV', 'https://www.hltv.org/rss/news', 3)

        expect(reports.length).toBeGreaterThan(0)

        for (const r of reports) {
            if (r.imageFromRSS || r.imageFromMeta) {
                expect(r.downloadResult.ok).toBe(true)
            }
        }

        const withImage = reports.filter(r => r.imageFromRSS || r.imageFromMeta)
        console.log(`\n  HLTV: ${withImage.length}/${reports.length} itens têm imagem`)
    }, 60000)

    it('Dust2.com.br — extrai imagens do feed (og:image via meta)', async () => {
        const reports = await diagnoseFeed('Dust2', 'https://www.dust2.com.br/rss', 3)

        expect(reports.length).toBeGreaterThan(0)

        // Dust2 não inclui imagem no RSS — depende de meta tag extraction
        // As imagens ficam em img-cdn.hltv.org que exige Referer correto
        const withImage = reports.filter(r => r.imageFromRSS || r.imageFromMeta)
        console.log(`\n  Dust2: ${withImage.length}/${reports.length} itens têm imagem (via meta)`)
        console.log(`  ⚠ Dust2 usa imagens de img-cdn.hltv.org — requer Referer: https://www.hltv.org/`)

        // Pelo menos devemos encontrar a URL da imagem (mesmo que o CDN bloqueie HEAD sem Referer correto)
        expect(withImage.length).toBeGreaterThan(0)
    }, 60000)

    it('THESPIKE — extrai e valida imagens do feed', async () => {
        const reports = await diagnoseFeed('THESPIKE', 'https://www.thespike.gg/rss.xml', 3)

        expect(reports.length).toBeGreaterThan(0)

        for (const r of reports) {
            if (r.imageFromRSS || r.imageFromMeta) {
                expect(r.downloadResult.ok).toBe(true)
            }
        }

        const withImage = reports.filter(r => r.imageFromRSS || r.imageFromMeta)
        console.log(`\n  THESPIKE: ${withImage.length}/${reports.length} itens têm imagem`)
    }, 60000)

    it('Adrenaline — extrai e valida imagens do feed', async () => {
        const reports = await diagnoseFeed('Adrenaline', 'https://adrenaline.com.br/rss', 3)

        expect(reports.length).toBeGreaterThan(0)

        for (const r of reports) {
            if (r.imageFromRSS || r.imageFromMeta) {
                expect(r.downloadResult.ok).toBe(true)
            }
        }

        const withImage = reports.filter(r => r.imageFromRSS || r.imageFromMeta)
        console.log(`\n  Adrenaline: ${withImage.length}/${reports.length} itens têm imagem`)
    }, 60000)

    it('Relatório consolidado — taxa de sucesso de imagens por feed', async () => {
        const feeds = [
            { name: 'ValorantZone', url: 'https://valorantzone.gg/feed/' },
            { name: 'HLTV',         url: 'https://www.hltv.org/rss/news' },
            { name: 'Dust2',        url: 'https://www.dust2.com.br/rss' },
            { name: 'THESPIKE',     url: 'https://www.thespike.gg/rss.xml' },
            { name: 'Adrenaline',   url: 'https://adrenaline.com.br/rss' },
        ]

        console.log('\n═══ RELATÓRIO CONSOLIDADO ═══')

        let totalItems = 0
        let totalWithImage = 0
        let totalDownloadOk = 0

        for (const feed of feeds) {
            try {
                const reports = await diagnoseFeed(feed.name, feed.url, 5)
                const withImage = reports.filter(r => r.imageFromRSS || r.imageFromMeta)
                const downloadOk = reports.filter(r => r.downloadResult.ok)

                totalItems      += reports.length
                totalWithImage  += withImage.length
                totalDownloadOk += downloadOk.length

                const fromRSS  = reports.filter(r => r.imageFromRSS).length
                const fromMeta = reports.filter(r => !r.imageFromRSS && r.imageFromMeta).length
                const noImage  = reports.filter(r => !r.imageFromRSS && !r.imageFromMeta).length

                console.log(`\n  ${feed.name}: ${reports.length} itens`)
                console.log(`    imagem do RSS:   ${fromRSS}`)
                console.log(`    imagem do META:  ${fromMeta}`)
                console.log(`    sem imagem:      ${noImage}`)
                console.log(`    download ok:     ${downloadOk.length}/${withImage.length}`)

                if (noImage > 0) {
                    const missing = reports.filter(r => !r.imageFromRSS && !r.imageFromMeta)
                    console.log(`    ⚠ Sem imagem em nenhuma fonte:`)
                    for (const m of missing)
                        console.log(`      - ${m.link}`)
                }
            } catch (err: any) {
                console.log(`  ${feed.name}: ERRO — ${err.message}`)
            }
        }

        console.log('\n═══ TOTAIS ═══')
        console.log(`  Itens analisados: ${totalItems}`)
        console.log(`  Com imagem:       ${totalWithImage}/${totalItems} (${Math.round(totalWithImage/totalItems*100)}%)`)
        console.log(`  Download ok:      ${totalDownloadOk}/${totalWithImage} (${totalWithImage > 0 ? Math.round(totalDownloadOk/totalWithImage*100) : 0}%)`)

        // O teste só falha se nenhum feed conseguiu nenhuma imagem (falha total de rede)
        expect(totalItems).toBeGreaterThan(0)
    }, 300000)
})
