import { db } from "../db.js";

import * as Inv from "./inventory.js";
import * as Level from "./levels.js";

export * as Stats from "./stats.js";
export const Inventory = Inv;

export interface InventoryStructure {
    coins: number;
    items: Record<string, number>;
}

export interface PlayerData {
    name: string;
    class: ClassType;
    intelligence: number;
    strength: number;
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

db.run(`CREATE TABLE IF NOT EXISTS Players (
    id TEXT PRIMARY KEY,
    level INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    data TEXT NOT NULL
)`);

export function createProfile(memberId: string, data: PlayerData): void {
    db.query("INSERT INTO Players (id, data, level, xp) VALUES ($id, $data, 0, 0)").run({ id: memberId, data: JSON.stringify(data) });
    Inventory.create(memberId);
}

export function deleteProfile(memberId: string): void {
    db.query("DELETE FROM Players WHERE id = $id").run({ id: memberId });
}

export function getProfile(memberId: string): PlayerData | null {
    const data = <{ data: string } | null>db.query("SELECT data FROM Players WHERE id = $id").get({ id: memberId });
    if (data === null) return null;
    return JSON.parse(data.data) as PlayerData;
}

export function updateProfile(memberId: string, data: PlayerData): void {
    db.query("UPDATE Players SET data = $data WHERE id = $id").run({ id: memberId, data: JSON.stringify(data) });
}

export function getProfileInAllGuilds(userId: string): Array<PlayerData> | null {
    const data = <Array<{ data: string }>>db.query(`SELECT data FROM Players WHERE id LIKE '%:${userId}'`).all();
    if (data.length === 0) return null;

    for (let i = 0, { length } = data; i < length; i++) data[i] = <never>JSON.parse(data[i].data);

    return data as unknown as Array<PlayerData>;
}

export function updatePlayerXp(memberId: string, playerXp: PlayerXP, xpAmount: number): PlayerXP {
    let { level, xp } = playerXp;
    const { xpRequired } = Level.getLevelMeta(level + 1);
    xp += xpAmount;
    if (xp >= xpRequired) {
        level += 1;
        xp -= xpRequired;
    }

    db.query("UPDATE Players SET level = $level, xp = $xp WHERE id = $id").run({ id: memberId, level, xp });
    return { level, xp };
}

export function getCurrentLevel(id: string): PlayerXP {
    return <PlayerXP>db.query("SELECT level, xp FROM Players WHERE id = $id").get({ id });
}
