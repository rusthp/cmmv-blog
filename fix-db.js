const Database = require('better-sqlite3');
const db = new Database('./apps/api/database.sqlite', { verbose: console.log });

// Update any featureImage that starts with /uploads/news to have the full API URL
const apiUrl = process.env.API_URL || "http://localhost:5000";
console.log(`Updating featureImage to use ${apiUrl}...`);

const info = db.prepare(`
    UPDATE posts 
    SET featureImage = ? || featureImage 
    WHERE featureImage LIKE '/uploads/news/%'
`).run(apiUrl);

console.log(`Updated ${info.changes} rows in posts.`);

const info2 = db.prepare(`
    UPDATE image_cache 
    SET localPath = ? || localPath 
    WHERE localPath LIKE '/uploads/news/%'
`).run(apiUrl);

console.log(`Updated ${info2.changes} rows in image_cache.`);
db.close();
