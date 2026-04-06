const https = require('https');

const url = 'https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/csgo/furia/furia-logo.png';

console.log(`Testing URL: ${url}`);

https.get(url, {
    headers: {
        'User-Agent': 'ProPlayNews-Ranking-Bot/1.0 (info@proplaynews.com)'
    }
}, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = [];
    res.on('data', chunk => {
        data.push(chunk);
    });
    
    res.on('end', () => {
        const buffer = Buffer.concat(data);
        console.log(`Downloaded ${buffer.length} bytes.`);
        
        // Check if there was an error response content
        if (res.statusCode !== 200) {
            console.log(`Error Response Body: ${buffer.toString()}`);
        } else {
            console.log('Success! The image is fully available.');
        }
    });

}).on('error', (e) => {
    console.error(`Request Error: ${e.message}`);
});
