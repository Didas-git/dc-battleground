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
    data TEXT NOT NULL
)`);

export function addEnemy(id: string, enemy: Enemy): void {
    db.query("INSERT OR REPLACE INTO Enemies (id, class, name, description, data) VALUES ($id, $class, $name, $description, $data)").run({
        id,
        class: enemy.class,
        name: enemy.name,
        description: enemy.description,
        data: JSON.stringify(enemy.stats)
    });
}

export function getEnemyMeta(id: string): Enemy {
    const enemy = <{ data: string }>db.query("SELECT class, name, description, data FROM Enemies WHERE id = $id").get({ id });
    enemy.data = <never>JSON.parse(enemy.data);
    return <never>enemy;
}
