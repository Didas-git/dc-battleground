import { db } from "../db.js";

import * as Inv from "./inventory.js";

export const Inventory = Inv;

export interface InventoryStructure {
    coins: number;
    items: Record<string, number>;
}

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

export interface PlayerXP {
    xp: number;
    level: number;
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

db.run("CREATE TABLE IF NOT EXISTS Players ( id TEXT PRIMARY KEY, level INTEGER NOT NULL, xp INTEGER NOT NULL, data TEXT NOT NULL )");

export function create(memberId: string, data: PlayerData): void {
    db.query("INSERT INTO Players (id, data, level, xp) VALUES ($id, $data, 0, 0)").run({ id: memberId, data: JSON.stringify(data) });
    Inventory.create(memberId);
}

export function getData(memberId: string): PlayerData | null {
    const data = <{ data: string } | null>db.query("SELECT data FROM Players WHERE id = $id").get({ id: memberId });
    if (data === null) return null;
    return JSON.parse(data.data) as PlayerData;
}

export function update(memberId: string, data: PlayerData): void {
    db.query("UPDATE Players SET data = $data WHERE id = $id").run({ id: memberId, data: JSON.stringify(data) });
}

export function getDataInAllGuilds(userId: string): Array<PlayerData> | null {
    const data = <Array<{ data: string }>>db.query(`SELECT data FROM Players WHERE id LIKE '%:${userId}'`).all();
    if (data.length === 0) return null;

    for (let i = 0, { length } = data; i < length; i++) data[i] = <never>JSON.parse(data[i].data);

    return data as unknown as Array<PlayerData>;
}

export function updateLevel(memberId: string, playerXp: PlayerXP, incrementType: number): PlayerXP {
    // TODO: Leveling formula
    const { level, xp } = playerXp;

    db.query("UPDATE Players SET level = $level, xp = $xp WHERE id = $id").run({ id: memberId, level, xp });
    return { level, xp };
}

export function getLevel(id: string): PlayerXP {
    return <PlayerXP>db.query("SELECT level, xp FROM Players WHERE id = $id").get({ id });
}
