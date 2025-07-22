#!/usr/bin/env node

/**
 * Debug tool para verificar metadados de redes sociais
 * Uso: node tools/debug-social-metadata.js <URL>
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Twitterbot/1.0)'
            }
        };

        const req = client.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve(data);
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

function extractMetadata(html) {
    const metadata = {
        ogTags: {},
        twitterTags: {},
        basic: {}
    };

    // Extract basic meta tags
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) metadata.basic.title = titleMatch[1].trim();

    const descMatch = html.match(/<meta[^>]+name=['"]description['"][^>]+content=['"]([^'"]*)['"]/i);
    if (descMatch) metadata.basic.description = descMatch[1];

    // Extract Open Graph tags
    const ogMatches = html.matchAll(/<meta[^>]+property=['"]og:([^'"]+)['"][^>]+content=['"]([^'"]*)['"]/gi);
    for (const match of ogMatches) {
        metadata.ogTags[match[1]] = match[2];
    }

    // Extract Twitter tags
    const twitterMatches = html.matchAll(/<meta[^>]+name=['"]twitter:([^'"]+)['"][^>]+content=['"]([^'"]*)['"]/gi);
    for (const match of twitterMatches) {
        metadata.twitterTags[match[1]] = match[2];
    }

    return metadata;
}

function validateImageUrl(imageUrl) {
    if (!imageUrl) return { valid: false, reason: 'No image URL provided' };
    
    if (!imageUrl.startsWith('http')) {
        return { valid: false, reason: 'Image URL must be absolute (start with http/https)' };
    }

    const extension = imageUrl.split('.').pop()?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!validExtensions.includes(extension)) {
        return { valid: false, reason: `Invalid image extension: ${extension}` };
    }

    return { valid: true, reason: 'Image URL appears valid' };
}

function analyzeMetadata(metadata) {
    const issues = [];
    const warnings = [];

    // Check Open Graph
    if (!metadata.ogTags.title) issues.push('Missing og:title');
    if (!metadata.ogTags.description) issues.push('Missing og:description');
    if (!metadata.ogTags.image) issues.push('Missing og:image');
    if (!metadata.ogTags.url) warnings.push('Missing og:url (recommended)');
    if (!metadata.ogTags.type) warnings.push('Missing og:type (recommended)');

    // Check Twitter Card
    if (!metadata.twitterTags.card) issues.push('Missing twitter:card');
    if (!metadata.twitterTags.title) warnings.push('Missing twitter:title (will fallback to og:title)');
    if (!metadata.twitterTags.description) warnings.push('Missing twitter:description (will fallback to og:description)');
    if (!metadata.twitterTags.image) warnings.push('Missing twitter:image (will fallback to og:image)');

    // Validate image
    const imageUrl = metadata.ogTags.image || metadata.twitterTags.image;
    if (imageUrl) {
        const imageValidation = validateImageUrl(imageUrl);
        if (!imageValidation.valid) {
            issues.push(`Image validation failed: ${imageValidation.reason}`);
        }

        // Check image type consistency
        const ogType = metadata.ogTags['image:type'];
        if (ogType) {
            const extension = imageUrl.split('.').pop()?.toLowerCase();
            const expectedTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'webp': 'image/webp',
                'gif': 'image/gif'
            };
            
            if (expectedTypes[extension] && expectedTypes[extension] !== ogType) {
                issues.push(`Image type mismatch: og:image:type is "${ogType}" but URL suggests "${expectedTypes[extension]}"`);
            }
        }
    }

    return { issues, warnings };
}

function printReport(url, metadata, analysis) {
    console.log('\n=== SOCIAL MEDIA METADATA REPORT ===');
    console.log(`URL: ${url}\n`);

    // Basic info
    console.log('📄 BASIC METADATA:');
    console.log(`  Title: ${metadata.basic.title || 'Not found'}`);
    console.log(`  Description: ${metadata.basic.description || 'Not found'}`);

    // Open Graph
    console.log('\n🌐 OPEN GRAPH TAGS:');
    Object.entries(metadata.ogTags).forEach(([key, value]) => {
        console.log(`  og:${key}: ${value}`);
    });

    // Twitter
    console.log('\n🐦 TWITTER CARD TAGS:');
    Object.entries(metadata.twitterTags).forEach(([key, value]) => {
        console.log(`  twitter:${key}: ${value}`);
    });

    // Issues
    console.log('\n🚨 ISSUES:');
    if (analysis.issues.length === 0) {
        console.log('  ✅ No critical issues found!');
    } else {
        analysis.issues.forEach(issue => console.log(`  ❌ ${issue}`));
    }

    // Warnings
    console.log('\n⚠️  WARNINGS:');
    if (analysis.warnings.length === 0) {
        console.log('  ✅ No warnings!');
    } else {
        analysis.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    }

    // Image preview
    const imageUrl = metadata.ogTags.image || metadata.twitterTags.image;
    if (imageUrl) {
        console.log('\n🖼️  IMAGE PREVIEW:');
        console.log(`  URL: ${imageUrl}`);
        console.log(`  Type: ${metadata.ogTags['image:type'] || 'Not specified'}`);
        console.log(`  Dimensions: ${metadata.ogTags['image:width'] || '?'}x${metadata.ogTags['image:height'] || '?'}`);
        console.log(`  Alt: ${metadata.ogTags['image:alt'] || metadata.twitterTags['image:alt'] || 'Not specified'}`);
    }

    console.log('\n=== END REPORT ===\n');
}

async function main() {
    const url = process.argv[2];
    
    if (!url) {
        console.error('Uso: node tools/debug-social-metadata.js <URL>');
        console.error('Exemplo: node tools/debug-social-metadata.js https://exemplo.com/post/slug');
        process.exit(1);
    }

    try {
        console.log(`Fetching: ${url}...`);
        const html = await fetchPage(url);
        const metadata = extractMetadata(html);
        const analysis = analyzeMetadata(metadata);
        
        printReport(url, metadata, analysis);
        
        // Exit with error code if there are issues
        if (analysis.issues.length > 0) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`Erro ao buscar a página: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 