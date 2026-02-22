import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'news');

/**
 * Validates SSRF by checking if an IP is private/local.
 */
function isPrivateIP(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return false;

    return (
        ip === '127.0.0.1' || // localhost
        parts[0] === 10 || // 10.x.x.x
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.x.x - 172.31.x.x
        (parts[0] === 192 && parts[1] === 168) || // 192.168.x.x
        (parts[0] === 169 && parts[1] === 254) // 169.254.x.x
    );
}

/**
 * Creates a unique hash of the given buffer content.
 */
function hashBuffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generates an SVG placeholder for a given title locally to prevent external dependency.
 */
function generatePlaceholder(title: string): string {
    const bgColor = '#1e1e2f';
    const textColor = '#ffffff';

    // Simple text wrapping (rough estimation)
    const words = title.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + word).length > 40) {
            lines.push(currentLine);
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    }
    if (currentLine) lines.push(currentLine);

    // Take at most 3 lines
    lines = lines.slice(0, 3);

    let textElements = '';
    const startY = 200 - ((lines.length - 1) * 20);

    lines.forEach((line, index) => {
        textElements += `<text x="50%" y="${startY + (index * 40)}" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="28" fill="${textColor}" font-weight="bold">${line.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`;
    });

    const svgString = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        ${textElements}
        <text x="50%" y="360" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#888888">Auto-generated Placeholder</text>
    </svg>`;

    return svgString;
}

export async function resolveImage(url: string, title: string): Promise<{ localPath: string, source: 'cache' | 'download' | 'placeholder', metadata?: any }> {
    // ---------------------------------------------------------
    // 0. Placeholder Logic (Fallback when URL is completely invalid empty/null)
    // ---------------------------------------------------------
    if (!url || url.trim() === '') {
        return createAndSavePlaceholder(title);
    }

    try {
        const parsedUrl = new URL(url);

        // ---------------------------------------------------------
        // 1. Layer 1: Protocol & Security Validation
        // ---------------------------------------------------------
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            throw new Error(`Invalid protocol: ${parsedUrl.protocol}`);
        }

        // DNS Rebinding / SSRF Protection
        if (parsedUrl.hostname === 'localhost') {
            throw new Error(`SSRF Blocked: Resolves to localhost`);
        }

        // Resolving DNS manually to check underlying IP
        try {
            const { address } = await dnsLookup(parsedUrl.hostname);
            if (isPrivateIP(address)) {
                throw new Error(`SSRF Blocked: Resolves to private IP (${address})`);
            }
        } catch (dnsErr: any) {
            // Ignore for trusted CDN domains if they fail strict resolution but normally work,
            // but generally we want to fail fast if we can't resolve it.
            throw new Error(`DNS resolution failed for ${parsedUrl.hostname}`);
        }

        // Note: For now we simulate that checking the "Cache" logic here 
        // using the URL happens in the main code (e.g., ImageCacheEntity.findOne({ originalUrl }))
        // If found -> return existing local path without head request.

        // ---------------------------------------------------------
        // 2. Head / Get request
        // ---------------------------------------------------------
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.google.com/'
        };

        const response = await fetch(url, {
            method: 'GET', // Using GET directly for the stream limit approach
            headers,
            redirect: 'follow',
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
            throw new Error(`Invalid content-type: ${contentType}`);
        }

        // Check content size initially from headers
        const contentLengthHeader = response.headers.get('content-length');
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        if (contentLengthHeader) {
            const size = parseInt(contentLengthHeader, 10);
            if (size > MAX_SIZE) {
                throw new Error(`Image too large: ${size} bytes`);
            }
        }

        // Stream and limit checking (if no content-length, we count bytes as we download)
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;

        if (response.body) {
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                    totalBytes += value.length;

                    if (totalBytes > MAX_SIZE) {
                        reader.cancel("Max size exceeded");
                        throw new Error(`Image exceeded maximum download size limits during streaming (> 5MB).`);
                    }
                }
            }
        } else {
            // Fallback if not streamable
            const buffer = await response.arrayBuffer();
            const uint8 = new Uint8Array(buffer);
            if (uint8.length > MAX_SIZE) throw new Error("Image exceeded maximum download size limits");
            chunks.push(uint8);
            totalBytes = uint8.length;
        }

        if (totalBytes === 0) {
            throw new Error("Empty image body");
        }

        const fullBuffer = Buffer.concat(chunks);

        // ---------------------------------------------------------
        // 3. Deduplication and Storage
        // ---------------------------------------------------------
        const hash = hashBuffer(fullBuffer);

        // Emulate Database check by File System check for testing script
        // In real app: const existing = await Repository.findOne(ImageCacheEntity, { hash });

        const ext = getExtensionFromContentType(contentType) || 'jpg';
        const filename = \`\${hash}.\${ext}\`;
        
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        const relativePath = path.join(year, month, filename);
        const absoluteDir = path.join(UPLOADS_DIR, year, month);
        const absolutePath = path.join(absoluteDir, filename);

        // Save to disk if it doesn't exist
        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absoluteDir, { recursive: true });
            fs.writeFileSync(absolutePath, fullBuffer);
            console.log(\`✅ Saved new image: \${relativePath}\`);
        } else {
            console.log(\`✅ Reused existing image by hash: \${relativePath}\`);
        }

        return {
            localPath: \`/uploads/news/\${relativePath.replace(/\\\\/g, '/')}\`,
            source: 'download',
            metadata: { hash, originalUrl: url, mimeType: contentType, fileSize: totalBytes }
        };

    } catch (error: any) {
        console.error(\`❌ Failed to resolve image \${url}: \${error.message}\`);
        // Fallback Layer 3: Locally generated SVG Placeholder
        return createAndSavePlaceholder(title);
    }
}

async function createAndSavePlaceholder(title: string): Promise<{ localPath: string, source: 'placeholder', metadata?: any }> {
    try {
        const svgContent = generatePlaceholder(title);
        const buffer = Buffer.from(svgContent, 'utf-8');
        const hash = hashBuffer(buffer);
        
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        const filename = \`\${hash}.svg\`;
        const relativePath = path.join(year, month, filename);
        const absoluteDir = path.join(UPLOADS_DIR, year, month);
        const absolutePath = path.join(absoluteDir, filename);

        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absoluteDir, { recursive: true });
            fs.writeFileSync(absolutePath, buffer);
            console.log(\`🎨 Genered new SVG placeholder: \${relativePath}\`);
        } else {
            console.log(\`🎨 Reused existing SVG placeholder by hash: \${relativePath}\`);
        }

        return {
            localPath: \`/uploads/news/\${relativePath.replace(/\\\\/g, '/')}\`,
            source: 'placeholder',
            metadata: { hash, mimeType: 'image/svg+xml', fileSize: buffer.length }
        };
    } catch (err: any) {
        console.error('CRITICAL: Failed to generate fallback placeholder', err);
        return { localPath: '', source: 'placeholder' };
    }
}

function getExtensionFromContentType(contentType: string): string {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('gif')) return 'gif';
    if (contentType.includes('svg')) return 'svg';
    if (contentType.includes('avif')) return 'avif';
    return 'jpg';
}

// ==========================================
// TEST RUNNER
// ==========================================
async function runTests() {
    console.log("=== STARTING IMAGE FALLBACK TESTS ===\\n");

    const tests = [
        { name: "1. Valid Image (Download)", url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png", title: "Test Google Logo" },
        { name: "2. Duplicate Image (Cache Hit by Hash)", url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png", title: "Test Google Logo Duplicate" },
        { name: "3. Invalid Protocol (SSRF/XSS)", url: "javascript:alert('xss')", title: "Hack Attempt" },
        { name: "4. Private Domain (SSRF)", url: "http://localhost:8080/image.jpg", title: "Localhost Block" },
        { name: "5. DNS Rebinding (Private IP)", url: "http://192.168.1.1/router.jpg", title: "Router Attack" },
        { name: "6. Bad External Image (404/403)", url: "https://this-website-does-not-exist-at-all.com/image.jpg", title: "Failed External Download" },
        { name: "7. Missing Image (Empty)", url: "", title: "My Awesome Game Review: CS2 is Back!" }
    ];

    for (const test of tests) {
        console.log(\`\\n\\n>>> Running: \${test.name}\`);
        const result = await resolveImage(test.url, test.title);
        console.log(\`Result:\`, result);
    }
}

if (require.main === module) {
    runTests().catch(console.error);
}
