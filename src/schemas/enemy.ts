import { db } from "../db.js";

export interface Enemy {
    class: EnemyClass;
    name: string;
    description: string;
}

export const enum EnemyClass {
    Undead
}

db.run(`
CREATE TABLE IF NOT EXISTS Enemies ( 
    id TEXT PRIMARY KEY,
    class INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL
)`);

export function addEnemy(id: string, enemy: Enemy): void {
    db.query("INSERT OR REPLACE INTO Enemies (id, class, name, description) VALUES ($id, $class, $name, $description)").run({
        id,
        class: enemy.class,
        name: enemy.name,
        description: enemy.description
    });
}

export function getEnemyMeta(id: string): Enemy {
    return <Enemy>db.query("SELECT class, name, description FROM Enemies WHERE id = $id").get({ id });
}
