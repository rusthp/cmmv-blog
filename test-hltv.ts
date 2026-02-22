async function main() {
    try {
        const response = await fetch("https://www.hltv.org/rss/news", {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        const xml = await response.text();
        console.log("Status:", response.status);
        console.log("XML Snippet:");
        console.log(xml.substring(0, 2000));
    } catch (e) {
        console.error("Fetch error:", e);
    }
}
main();
