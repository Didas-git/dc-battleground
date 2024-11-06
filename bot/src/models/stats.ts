import { db } from "../db.js";

export const enum DamageType {
    Ranged,
    Melee
}

/** To any other type than physical the general `elemental` bonus and resistances also apply */
export const enum ElementType {
    Physical,
    Fire,
    Water,
    Nature,
    Electric,
    Ice,
    Wind,
    Light,
    Cosmos,
    Poison
}

export type EntityStats = Omit<GenericStats, "hp" | "mana">
& { hp: number, mana: number };

export interface GenericStats {
    hp: { current: number, max: number };
    ward: number;
    atk: number;
    mana: { current: number, max: number };
    crit_rate: number;
    crit_damage: number;
    def: number;
    armor: number;
    bonus: {
        atk: number,
        elemental: number,
        ranged: number,
        melee: number,
        physical: number,
        fire: number,
        water: number,
        nature: number,
        electric: number,
        ice: number,
        wind: number,
        light: number,
        cosmos: number,
        poison: number
    };
    resistances: {
        elemental: number,
        ranged: number,
        melee: number,
        physical: number,
        fire: number,
        water: number,
        nature: number,
        electric: number,
        ice: number,
        wind: number,
        light: number,
        cosmos: number,
        poison: number
    };
}

db.run("CREATE TABLE IF NOT EXISTS Stats ( id TEXT PRIMARY KEY, data TEXT NOT NULL )");

export function get(id: string): GenericStats | null {
    const stats = <{ data: string } | null>db.query("SELECT data FROM Stats WHERE id = $id").get({ id });
    if (stats === null) return null;
    return <never>JSON.parse(stats.data);
}

export function create(id: string, stats: GenericStats): void {
    db.query("INSERT INTO Stats (id, data) VALUES ($id, $data)").run({ id, data: JSON.stringify(stats) });
}

export function update(id: string, stats: GenericStats): void {
    db.query("UPDATE Stats SET data = $data WHERE id = $id").run({ id, data: JSON.stringify(stats) });
}

export function remove(id: string): void {
    db.query("DELETE FROM Stats WHERE id = $id").run({ id });
}
