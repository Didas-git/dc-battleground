import { db } from "../db.js";

import { NormalItemTable } from "../items/normal.js";

db.run("CREATE TABLE IF NOT EXISTS Items ( id TEXT PRIMARY KEY, type INTEGER NOT NULL, RARITY INTEGER NOT NULL, name TEXT NOT NULL )");

if (db.query("SELECT * FROM Items").all({ name: "Items" }).length === 0) {
    const query = db.query("INSERT INTO Items (id, type, rarity, name) VALUES ($id, $type, $rarity, $name)");
    const items = NormalItemTable.rdsContents;

    for (let i = 0, { length } = items; i < length; i++) {
        const { id, type, rarity, name } = items[i].rdsValue;

        query.run({
            id,
            type,
            rarity,
            name
        });
    }
}
