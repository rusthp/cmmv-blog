const fs = require('fs');
const https = require('https');

https.get("https://www.hltv.org/rss/news", {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
}, (res) => {
    console.log("Status:", res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('hltv.xml', data);
        console.log("Wrote hltv.xml with length: " + data.length);
    });
}).on('error', (e) => {
    console.error(e);
});
