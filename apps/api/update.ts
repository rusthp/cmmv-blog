import { DataSource } from 'typeorm';

const dataSource = new DataSource({
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: false,
    logging: true,
});

async function run() {
    await dataSource.initialize();

    // We update anything that looks like /uploads/news... to have the full absolute API URL
    const apiUrl = process.env.API_URL || "http://localhost:5000";

    try {
        const result1 = await dataSource.query(`UPDATE "posts_entity" SET "featureImage" = '${apiUrl}' || "featureImage" WHERE "featureImage" LIKE '/uploads/news/%'`);
        console.log("Updated posts_entity:", result1);
    } catch (e) {
        console.error("Error updating posts_entity:", e.message);
    }

    try {
        const result2 = await dataSource.query(`UPDATE "image_cache_entity" SET "localPath" = '${apiUrl}' || "localPath" WHERE "localPath" LIKE '/uploads/news/%'`);
        console.log("Updated image_cache_entity:", result2);
    } catch (e) {
        console.error("Error updating image_cache_entity:", e.message);
    }

    process.exit(0);
}

run();
