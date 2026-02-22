const Database = require('better-sqlite3');
try {
    const db = new Database('./apps/api/database.sqlite', { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
    console.log("Tables:", tables);
    db.close();
} catch (e) {
    console.error(e.message);
}
