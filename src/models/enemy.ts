import { db } from "../db.js";

import type { EnemyJSON } from "#loot-table/types.js";

export interface Enemy {
    class: EnemyClass;
    name: string;
    description: string;
    stats: Required<EnemyJSON["stats"]>;
}

export const enum EnemyClass {
    Undead
}

db.run(`
CREATE TABLE IF NOT EXISTS Enemies ( 
    id TEXT PRIMARY KEY,
    class INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    stats TEXT NOT NULL
)`);

export function addEnemy(id: string, enemy: Enemy): void {
    db.query("INSERT OR REPLACE INTO Enemies (id, class, name, description, stats) VALUES ($id, $class, $name, $description, $stats)").run({
        id,
        class: enemy.class,
        name: enemy.name,
        description: enemy.description,
        stats: JSON.stringify(enemy.stats)
    });
}

export function getEnemyMeta(id: string): Enemy {
    const enemy = <{ stats: string }>db.query("SELECT class, name, description, stats FROM Enemies WHERE id = $id").get({ id });
    enemy.stats = <never>JSON.parse(enemy.stats);
    return <never>enemy;
}
