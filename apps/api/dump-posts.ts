import { DataSource } from 'typeorm';
import * as fs from 'fs';

const dataSource = new DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: false,
    logging: false,
});

async function run() {
    await dataSource.initialize();

    try {
        const posts = await dataSource.query(`SELECT title, featureImage, "publishedAt", "createdAt" FROM posts_entity ORDER BY "createdAt" DESC LIMIT 15`);
        fs.writeFileSync('posts-dump.json', JSON.stringify(posts, null, 2));
    } catch (e) {
        fs.writeFileSync('posts-dump.json', JSON.stringify({ error: e.message }));
    }

    process.exit(0);
}

run();
