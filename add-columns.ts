import * as sqlite3 from 'sqlite3';

const db = new sqlite3.Database('b:/cmmv-blog/apps/api/database.sqlite');

db.serialize(() => {
    try {
        db.run("ALTER TABLE rss_aggregation_feed_raw ADD COLUMN originalPubDate DATETIME;");
        console.log("Added originalPubDate");
    } catch (e) { console.error(e) }

    try {
        db.run("ALTER TABLE rss_aggregation_feed_raw ADD COLUMN truePubDate DATETIME;");
        console.log("Added truePubDate");
    } catch (e) { console.error(e) }
});

db.close();
