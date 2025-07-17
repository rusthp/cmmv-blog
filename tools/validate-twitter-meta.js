#!/usr/bin/env node

/**
 * Twitter Meta Tags Validator
 * 
 * Usage: node tools/validate-twitter-meta.js <post-url>
 * Example: node tools/validate-twitter-meta.js https://proplaynews.com.br/post/pain-gaming-e-eliminada-da-fissure-playground-1-o-que-aconteceu
 */

const https = require('https');
const http = require('http');

async function validateTwitterMeta(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, {
            headers: {
                'User-Agent': 'Twitterbot/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        }, (res) => {
            let html = '';
            
            res.on('data', (chunk) => {
                html += chunk;
            });
            
            res.on('end', () => {
                try {
                    // Extract meta tags
                    const twitterMetas = html.match(/<meta[^>]*name="twitter:[^"]*"[^>]*>/g) || [];
                    const ogMetas = html.match(/<meta[^>]*property="og:[^"]*"[^>]*>/g) || [];
                    
                    // Parse meta tags
                    const twitterTags = {};
                    const ogTags = {};
                    
                    twitterMetas.forEach(tag => {
                        const nameMatch = tag.match(/name="([^"]+)"/);
                        const contentMatch = tag.match(/content="([^"]+)"/);
                        if (nameMatch && contentMatch) {
                            twitterTags[nameMatch[1]] = contentMatch[1];
                        }
                    });
                    
                    ogMetas.forEach(tag => {
                        const propMatch = tag.match(/property="([^"]+)"/);
                        const contentMatch = tag.match(/content="([^"]+)"/);
                        if (propMatch && contentMatch) {
                            ogTags[propMatch[1]] = contentMatch[1];
                        }
                    });
                    
                    // Critical tags validation
                    const critical = {
                        'twitter:card': twitterTags['twitter:card'],
                        'twitter:site': twitterTags['twitter:site'],
                        'twitter:title': twitterTags['twitter:title'],
                        'twitter:description': twitterTags['twitter:description'],
                        'twitter:image': twitterTags['twitter:image'],
                        'og:title': ogTags['og:title'],
                        'og:description': ogTags['og:description'],
                        'og:image': ogTags['og:image'],
                        'og:url': ogTags['og:url']
                    };
                    
                    const missing = Object.entries(critical)
                        .filter(([key, value]) => !value)
                        .map(([key]) => key);
                    
                    resolve({
                        url,
                        success: missing.length === 0,
                        missing,
                        twitter: twitterTags,
                        og: ogTags,
                        critical,
                        totalTwitterTags: twitterMetas.length,
                        totalOgTags: ogMetas.length
                    });
                    
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

function printResults(result) {
    console.log('\n🔍 TWITTER META TAGS VALIDATION REPORT');
    console.log('=====================================');
    console.log(`📄 URL: ${result.url}`);
    console.log(`✅ Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🐦 Twitter Tags Found: ${result.totalTwitterTags}`);
    console.log(`📘 Open Graph Tags Found: ${result.totalOgTags}`);
    
    if (result.missing.length > 0) {
        console.log(`\n❌ Missing Critical Tags:`);
        result.missing.forEach(tag => console.log(`   - ${tag}`));
    }
    
    console.log('\n📋 CRITICAL TAGS STATUS:');
    console.log('========================');
    Object.entries(result.critical).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        const preview = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'MISSING';
        console.log(`${status} ${key}: ${preview}`);
    });
    
    if (result.success) {
        console.log('\n🎉 All critical Twitter Card tags are present!');
        console.log('✅ Your page should generate Twitter previews correctly.');
    } else {
        console.log('\n⚠️  ISSUES DETECTED:');
        console.log('- Missing critical Twitter meta tags');
        console.log('- Twitter/X may not generate previews properly');
        console.log('- Recommendation: Add missing tags to your page');
    }
    
    console.log('\n🔗 USEFUL LINKS:');
    console.log('- Twitter Card Validator: https://cards-dev.twitter.com/validator');
    console.log('- Twitter Card Documentation: https://developer.x.com/en/docs/twitter-for-websites/cards');
}

// Main execution
if (require.main === module) {
    const url = process.argv[2];
    
    if (!url) {
        console.error('❌ Error: Please provide a URL to validate');
        console.log('Usage: node validate-twitter-meta.js <url>');
        console.log('Example: node validate-twitter-meta.js https://example.com/post/my-post');
        process.exit(1);
    }
    
    console.log(`🔍 Validating Twitter meta tags for: ${url}`);
    console.log('⏳ Fetching page as Twitterbot...\n');
    
    validateTwitterMeta(url)
        .then(printResults)
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}

module.exports = validateTwitterMeta; 