const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('b:/cmmv-blog/apps/api/database.sqlite', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        fs.writeFileSync('b:/cmmv-blog/db_err.txt', err.message);
        return;
    }
    db.all("SELECT id, title, channel, pubDate, pipelineState, createdAt FROM feed_raw WHERE pipelineState = 0 ORDER BY createdAt DESC LIMIT 5", (err, rows) => {
        if (err) {
            fs.writeFileSync('b:/cmmv-blog/db_result.txt', "ERR: " + err.message);
        } else {
            fs.writeFileSync('b:/cmmv-blog/db_result.txt', JSON.stringify(rows, null, 2));
        }
        db.close();
    });
});
