import { db } from "../db.js";

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

export function getStats(id: string): GenericStats {
    const { data } = <{ data: string }>db.query("SELECT data FROM Stats WHERE id = $id").get({ id });
    return <never>JSON.parse(data);
}

export function createStats(id: string, stats: GenericStats): void {
    db.query("INSERT INTO Stats (id, data) VALUES ($id, $data)").run({ id, data: JSON.stringify(stats) });
}
