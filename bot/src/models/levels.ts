import { db } from "../db.js";

export interface Level {
    level: number;
    xpRequired: number;
}

db.run("CREATE TABLE IF NOT EXISTS Levels ( id INTEGER PRIMARY KEY, xp_required INTEGER NOT NULL )");

export function addLevel(level: number, xp: number): void {
    db.query("INSERT OR REPLACE INTO Levels (id, xp_required) VALUES ($id, $xp)").run({
        id: level,
        xp
    });
}

export function getLevelMeta(level: number): Level {
    return <Level>db.query("SELECT id as level, xp_required as xpRequired FROM Levels WHERE id = $id").get({ id: level });
}
