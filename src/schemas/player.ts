import { db } from "../db.js";

import * as Inv from "./inventory.js";

export const Inventory = Inv;

export interface PlayerData {
    class: ClassType;
    hp: { current: number, max: number };
    ward: number;
    atk: number;
    mana: { current: number, max: number };
    crit_rate: number;
    crit_damage: number;
    def: number;
    armor: number;
    intelligence: number;
    strength: number;
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
    last_scan: number;
}

export interface Effect {
    /// This is the time in seconds.
    /// If its set to 0 (default for majority) it means its not taking effect.
    /// If its set to Infinity it means it cannot be removed with normal methods.
    time: number;
    /// Some effects can have an amount of `0` which means
    /// the effect is present but is not affecting any stats.
    amount: number;
    /// Can the effect be removed with cleansing magic/effects.
    can_cleanse: boolean;
}

export interface Effects {
    bleeding: Effect;
    broken: Effect;
    frozen: Effect;
    wet: Effect;
    burning: Effect;
    cold: Effect;
    rotting: Effect;
    trauma: Effect;
    blind: Effect;
    deaf: Effect;
}

export const enum ClassType {
    None,
    Mage,
    Warrior
}

export const CLASS_MAPPINGS = {
    [ClassType.None]: "#$#",
    [ClassType.Mage]: "Mage",
    [ClassType.Warrior]: "Warrior"
};

db.run("CREATE TABLE IF NOT EXISTS Players ( id TEXT PRIMARY KEY, data TEXT NOT NULL )");

export function create(id: `${string}:${string}`, data: PlayerData): void {
    db.query("INSERT INTO Players (id, data) VALUES ($id, $data)").run({ id, data: JSON.stringify(data) });
    Inventory.create(id);
}

export function getData(id: `${string}:${string}`): PlayerData | null {
    const data = <{ data: string } | null>db.query("SELECT data FROM Players WHERE id = $id").get({ id });
    if (data === null) return null;
    return JSON.parse(data.data) as PlayerData;
}

export function update(id: `${string}:${string}`, data: PlayerData): void {
    db.query("UPDATE Players SET data = $data WHERE id = $id").run({ id, data: JSON.stringify(data) });
}

export function getDataInAllGuilds(id: string): Array<PlayerData> | null {
    const data = <Array<{ data: string }>>db.query(`SELECT data FROM Players WHERE id LIKE '%:${id}'`).all();
    if (data.length === 0) return null;

    for (let i = 0, { length } = data; i < length; i++) data[i] = <never>JSON.parse(data[i].data);

    return data as unknown as Array<PlayerData>;
}
