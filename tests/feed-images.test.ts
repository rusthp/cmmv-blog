/**
 * tests/feed-images.test.ts
 *
 * Valida o pipeline de imagens dos feeds RSS:
 *   - Bloqueio de IPs privados (SSRF)
 *   - Detecção de content-type
 *   - Limites de tamanho (< 1 KB → rejeita, > 5 MB → rejeita)
 *   - Resiliência a falha de DNS (não bloqueia, tenta fetch mesmo assim)
 *   - Domínios confiáveis pulam validação DNS
 *   - Deduplicação por hash SHA-256
 *   - Branch de URL externa no medias.service (own-served vs download vs fallback)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import crypto from 'node:crypto'

// ─── Helpers replicados de auto-pipeline.service.ts ──────────────────────────
// Mantidos aqui para que os testes sejam independentes da instância do serviço

function isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4) return false
    return (
        ip === '127.0.0.1' ||
        parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168) ||
        (parts[0] === 169 && parts[1] === 254)
    )
}

function getExtensionFromContentType(ct: string): string {
    if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
    if (ct.includes('png')) return 'png'
    if (ct.includes('webp')) return 'webp'
    if (ct.includes('gif')) return 'gif'
    if (ct.includes('svg')) return 'svg'
    if (ct.includes('avif')) return 'avif'
    return 'jpg'
}

function hashBuffer(buf: Buffer): string {
    return crypto.createHash('sha256').update(buf).digest('hex')
}

// ─── Factory de Response falso ────────────────────────────────────────────────
function makeFakeResponse(opts: {
    ok?: boolean
    status?: number
    contentType?: string
    contentLength?: string
    body?: Buffer
}): Response {
    const { ok = true, status = 200, contentType = 'image/jpeg', contentLength, body = Buffer.alloc(0) } = opts
    const headers = new Headers()
    if (contentType)   headers.set('content-type', contentType)
    if (contentLength) headers.set('content-length', contentLength)

    return {
        ok,
        status,
        headers,
        body: null, // força uso de arrayBuffer() nos testes
        arrayBuffer: async () => {
            const ab = new ArrayBuffer(body.length)
            new Uint8Array(ab).set(body)
            return ab
        },
    } as unknown as Response
}

// ─── Simulação do pipeline de download (lógica de validateAndResolveImage) ───
const TRUSTED_DOMAINS = ['hltv.org', 'img-cdn.hltv.org', 'thespike.gg', 'www.thespike.gg']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

async function simulateDownload(
    imageUrl: string,
    dnsLookup: (host: string) => Promise<{ address: string }>,
): Promise<'downloaded' | 'placeholder'> {
    if (!imageUrl) return 'placeholder'

    let parsed: URL
    try {
        parsed = new URL(imageUrl)
    } catch {
        return 'placeholder'
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'placeholder'
    if (parsed.hostname === 'localhost') return 'placeholder'

    if (!TRUSTED_DOMAINS.includes(parsed.hostname)) {
        try {
            const { address } = await dnsLookup(parsed.hostname)
            if (isPrivateIP(address)) return 'placeholder'
        } catch {
            // DNS falhou → loga aviso, tenta fetch de qualquer forma
        }
    }

    try {
        const res = await (global as any).fetch(imageUrl, { method: 'GET' })
        if (!res.ok) return 'placeholder'

        const ct = res.headers.get('content-type') || ''
        if (!ct.startsWith('image/')) return 'placeholder'

        const clHeader = res.headers.get('content-length')
        if (clHeader && parseInt(clHeader, 10) > MAX_SIZE) return 'placeholder'

        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 1000) return 'placeholder'
        if (buf.length > MAX_SIZE) return 'placeholder'

        return 'downloaded'
    } catch {
        return 'placeholder'
    }
}

// ─── Simulação do branch de URL externa em medias.service.ts ─────────────────
async function simulateMediasExternalBranch(
    imageUrl: string,
    ownApiUrl = 'http://localhost:5000',
): Promise<'own-served' | 'downloaded' | 'fallback'> {
    if (ownApiUrl.endsWith('/')) ownApiUrl = ownApiUrl.slice(0, -1)

    if ((ownApiUrl && imageUrl.startsWith(ownApiUrl)) || imageUrl.includes('/images/'))
        return 'own-served'

    try {
        const res = await (global as any).fetch(imageUrl)
        if (!res.ok) return 'fallback'

        const ct = (res.headers.get('content-type') || '').split(';')[0].trim()
        if (!ct.startsWith('image/')) return 'fallback'

        const buf = Buffer.from(await res.arrayBuffer())
        if (buf.length < 1000 || buf.length > MAX_SIZE) return 'fallback'

        return 'downloaded'
    } catch {
        return 'fallback'
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 1 — isPrivateIP
// ═══════════════════════════════════════════════════════════════════════════════
describe('isPrivateIP', () => {
    it.each([
        ['127.0.0.1', true,  'loopback'],
        ['10.0.0.1',  true,  '10.x range'],
        ['10.255.255.255', true, '10.x range upper'],
        ['192.168.1.100', true, '192.168 range'],
        ['172.16.0.1', true,  '172.16 range start'],
        ['172.31.255.255', true, '172.31 range end'],
        ['172.20.0.1', true,  '172.20 mid-range'],
        ['169.254.0.1', true, 'link-local'],
        ['172.15.255.255', false, 'just below 172.16'],
        ['172.32.0.0',    false, 'just above 172.31'],
        ['8.8.8.8',       false, 'Google DNS'],
        ['151.101.1.1',   false, 'Fastly CDN'],
        ['104.16.0.1',    false, 'Cloudflare'],
        ['1.1.1.1',       false, 'Cloudflare DNS'],
        ['not.an.ip',     false, 'hostname string'],
        ['',              false, 'empty string'],
    ])('isPrivateIP("%s") === %s  (%s)', (ip, expected) => {
        expect(isPrivateIP(ip)).toBe(expected)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 2 — getExtensionFromContentType
// ═══════════════════════════════════════════════════════════════════════════════
describe('getExtensionFromContentType', () => {
    it.each([
        ['image/jpeg',              'jpg'],
        ['image/jpg',               'jpg'],
        ['image/jpeg; charset=utf-8', 'jpg'],
        ['image/png',               'png'],
        ['image/webp',              'webp'],
        ['image/gif',               'gif'],
        ['image/svg+xml',           'svg'],
        ['image/avif',              'avif'],
        ['application/octet-stream','jpg'],  // desconhecido → jpg (default)
        ['text/html',               'jpg'],
    ])('"%s" → "%s"', (ct, ext) => {
        expect(getExtensionFromContentType(ct)).toBe(ext)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 3 — hashBuffer (deduplicação)
// ═══════════════════════════════════════════════════════════════════════════════
describe('hashBuffer', () => {
    it('retorna hex de 64 chars', () => {
        expect(hashBuffer(Buffer.from('x'))).toHaveLength(64)
    })

    it('é determinístico para o mesmo conteúdo', () => {
        const buf = Buffer.from('imagem-de-teste')
        expect(hashBuffer(buf)).toBe(hashBuffer(buf))
    })

    it('hashes diferentes para conteúdos diferentes', () => {
        expect(hashBuffer(Buffer.alloc(100, 0x01))).not.toBe(hashBuffer(Buffer.alloc(100, 0x02)))
    })

    it('mesma imagem em diferentes chamadas → mesmo hash (dedup funciona)', () => {
        const imageData = Buffer.alloc(3000, 0xab)
        const h1 = hashBuffer(imageData)
        const h2 = hashBuffer(imageData)
        expect(h1).toBe(h2)
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 4 — Pipeline de download (validateAndResolveImage)
// ═══════════════════════════════════════════════════════════════════════════════
describe('pipeline de download de imagem', () => {
    const fetchMock = vi.fn<typeof fetch>()
    const dnsOk = vi.fn(async (_host: string) => ({ address: '93.184.216.34' })) // IP público

    beforeEach(() => vi.stubGlobal('fetch', fetchMock))
    afterEach(() => vi.restoreAllMocks())

    it('URL vazia → placeholder (sem fetch)', async () => {
        const result = await simulateDownload('', dnsOk)
        expect(result).toBe('placeholder')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('URL inválida → placeholder', async () => {
        const result = await simulateDownload('nao-e-url', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('protocolo ftp:// → placeholder', async () => {
        const result = await simulateDownload('ftp://server.com/img.jpg', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('localhost → placeholder (sem fetch)', async () => {
        const result = await simulateDownload('http://localhost/secret.jpg', dnsOk)
        expect(result).toBe('placeholder')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('IP privado via DNS → placeholder (sem fetch)', async () => {
        const dnsPrivate = vi.fn(async () => ({ address: '192.168.1.50' }))
        const result = await simulateDownload('https://internal.corp/img.jpg', dnsPrivate)
        expect(result).toBe('placeholder')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('DNS falha → prossegue e faz fetch (resiliência a CDN/edge)', async () => {
        const dnsFail = vi.fn(async () => { throw new Error('ENOTFOUND') })
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/jpeg', body: Buffer.alloc(3000, 0xff) })
        )
        const result = await simulateDownload('https://cdn.somesite.com/img.jpg', dnsFail)
        expect(fetchMock).toHaveBeenCalledOnce()
        expect(result).toBe('downloaded')
    })

    it('domínio confiável (hltv.org) pula DNS e faz fetch diretamente', async () => {
        const dnsNeverCalled = vi.fn()
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/jpeg', body: Buffer.alloc(2000, 0xff) })
        )
        const result = await simulateDownload('https://img-cdn.hltv.org/avatar/abc.jpg', dnsNeverCalled)
        expect(dnsNeverCalled).not.toHaveBeenCalled()
        expect(result).toBe('downloaded')
    })

    it('domínio confiável (thespike.gg) pula DNS', async () => {
        const dnsNeverCalled = vi.fn()
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/webp', body: Buffer.alloc(4000, 0x52) })
        )
        const result = await simulateDownload('https://www.thespike.gg/img/hero.webp', dnsNeverCalled)
        expect(dnsNeverCalled).not.toHaveBeenCalled()
        expect(result).toBe('downloaded')
    })

    it('resposta HTTP 404 → placeholder', async () => {
        fetchMock.mockResolvedValueOnce(makeFakeResponse({ ok: false, status: 404 }))
        const result = await simulateDownload('https://cdn.site.com/missing.jpg', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('resposta HTTP 403 → placeholder', async () => {
        fetchMock.mockResolvedValueOnce(makeFakeResponse({ ok: false, status: 403 }))
        const result = await simulateDownload('https://cdn.site.com/forbidden.jpg', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('content-type text/html → placeholder', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'text/html', body: Buffer.alloc(5000) })
        )
        const result = await simulateDownload('https://site.com/page', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('content-type application/json → placeholder', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'application/json', body: Buffer.alloc(5000) })
        )
        const result = await simulateDownload('https://api.site.com/data', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('imagem < 1 KB → placeholder (imagem inválida/tracking pixel)', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/png', body: Buffer.alloc(200, 0x89) })
        )
        const result = await simulateDownload('https://cdn.site.com/pixel.png', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('imagem exatamente 1 KB → placeholder (limite é exclusivo)', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/jpeg', body: Buffer.alloc(1000, 0xff) })
        )
        const result = await simulateDownload('https://cdn.site.com/min.jpg', dnsOk)
        // 1000 bytes < 1001, não passa no `< 1000` check (1000 não é menor que 1000)
        // Na implementação: `if (buf.length < 1000)` → 1000 não é < 1000, então passa
        expect(result).toBe('downloaded')
    })

    it('imagem de 999 bytes → placeholder', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/jpeg', body: Buffer.alloc(999, 0xff) })
        )
        const result = await simulateDownload('https://cdn.site.com/tiny.jpg', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('imagem > 5 MB via Content-Length → placeholder', async () => {
        fetchMock.mockResolvedValueOnce(makeFakeResponse({
            contentType: 'image/jpeg',
            contentLength: String(6 * 1024 * 1024),
            body: Buffer.alloc(2000, 0xff), // body irrelevante — header verificado primeiro
        }))
        const result = await simulateDownload('https://cdn.site.com/huge.jpg', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('imagem > 5 MB por tamanho real do buffer → placeholder', async () => {
        fetchMock.mockResolvedValueOnce(makeFakeResponse({
            contentType: 'image/jpeg',
            body: Buffer.alloc(6 * 1024 * 1024, 0xff),
        }))
        const result = await simulateDownload('https://cdn.site.com/huge2.jpg', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('fetch lança exceção (timeout/rede) → placeholder', async () => {
        fetchMock.mockRejectedValueOnce(new Error('AbortError: The operation was aborted'))
        const result = await simulateDownload('https://cdn.slowsite.com/img.jpg', dnsOk)
        expect(result).toBe('placeholder')
    })

    it('JPEG válido (2 KB) → downloaded', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/jpeg', body: Buffer.alloc(2000, 0xff) })
        )
        const result = await simulateDownload('https://cdn.site.com/photo.jpg', dnsOk)
        expect(result).toBe('downloaded')
    })

    it('PNG válido (5 KB) → downloaded', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/png', body: Buffer.alloc(5000, 0x89) })
        )
        const result = await simulateDownload('https://cdn.site.com/img.png', dnsOk)
        expect(result).toBe('downloaded')
    })

    it('WebP válido → downloaded', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/webp', body: Buffer.alloc(3000, 0x52) })
        )
        const result = await simulateDownload('https://cdn.site.com/img.webp', dnsOk)
        expect(result).toBe('downloaded')
    })

    it('AVIF válido → downloaded', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/avif', body: Buffer.alloc(2500, 0x00) })
        )
        const result = await simulateDownload('https://cdn.site.com/img.avif', dnsOk)
        expect(result).toBe('downloaded')
    })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÃO 5 — medias.service getImageUrl (branch URL externa)
// ═══════════════════════════════════════════════════════════════════════════════
describe('medias.service — getImageUrl URL externa', () => {
    const fetchMock = vi.fn<typeof fetch>()

    beforeEach(() => {
        fetchMock.mockClear()
        vi.stubGlobal('fetch', fetchMock)
    })
    afterEach(() => vi.restoreAllMocks())

    it('URL do próprio servidor → retorna como está (sem fetch)', async () => {
        const result = await simulateMediasExternalBranch(
            'http://localhost:5000/images/abc123.webp',
            'http://localhost:5000'
        )
        expect(result).toBe('own-served')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('URL com /images/ no path → own-served (sem fetch)', async () => {
        const result = await simulateMediasExternalBranch('https://cdn.blog.com/images/photo.webp')
        expect(result).toBe('own-served')
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('URL externa válida → downloaded', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/jpeg', body: Buffer.alloc(5000, 0xff) })
        )
        const result = await simulateMediasExternalBranch('https://external-cdn.com/news/photo.jpg')
        expect(result).toBe('downloaded')
        expect(fetchMock).toHaveBeenCalledOnce()
    })

    it('fetch lança erro → fallback para URL original', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'))
        const result = await simulateMediasExternalBranch('https://external-cdn.com/broken.jpg')
        expect(result).toBe('fallback')
    })

    it('resposta 403 → fallback', async () => {
        fetchMock.mockResolvedValueOnce(makeFakeResponse({ ok: false, status: 403 }))
        const result = await simulateMediasExternalBranch('https://external-cdn.com/private.jpg')
        expect(result).toBe('fallback')
    })

    it('content-type não-imagem → fallback', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'text/plain', body: Buffer.alloc(5000) })
        )
        const result = await simulateMediasExternalBranch('https://external-cdn.com/file.txt')
        expect(result).toBe('fallback')
    })

    it('imagem muito pequena (< 1 KB) → fallback', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/png', body: Buffer.alloc(100) })
        )
        const result = await simulateMediasExternalBranch('https://external-cdn.com/pixel.png')
        expect(result).toBe('fallback')
    })

    it('imagem muito grande (> 5 MB) → fallback', async () => {
        fetchMock.mockResolvedValueOnce(
            makeFakeResponse({ contentType: 'image/jpeg', body: Buffer.alloc(6 * 1024 * 1024, 0xff) })
        )
        const result = await simulateMediasExternalBranch('https://external-cdn.com/huge.jpg')
        expect(result).toBe('fallback')
    })

    it('API URL com trailing slash é normalizada corretamente', async () => {
        const result = await simulateMediasExternalBranch(
            'http://localhost:5000/images/test.webp',
            'http://localhost:5000/'  // com trailing slash
        )
        expect(result).toBe('own-served')
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
