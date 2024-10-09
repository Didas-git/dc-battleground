import { db } from "../db.js";

import type { BoardData } from "./board.js";

db.run(`
CREATE TABLE IF NOT EXISTS Battles (
    id INTEGER PRIMARY KEY,
    type INTEGER NOT NULL,
    attacker TEXT NOT NULL,
    defender TEXT NOT NULL,
    last_move INTEGER NOT NULL,
    to TEXT NOT NULL
)`);

export const enum LastMove {
    Attacker,
    Defender
}

export const enum BattleFlowType {
    Mob,
    Player
}

export interface BattleFlow {
    type: BattleFlowType;
    attacker: string;
    defender: string;
    last_move: LastMove;
    to: BoardData;
}

export function createBattleFlow(id: string, type: BattleFlowType, attackerId: string, defenderId: string, defenderPosition: BoardData): void {
    db.query("INSERT INTO Battles (id, type, attacker, defender, last_move, to) VALUES ($id, $type, $attacker, $defender, $last, $to)").run({
        id,
        type,
        attacker: attackerId,
        defender: defenderId,
        last: LastMove.Attacker,
        to: JSON.stringify(defenderPosition)
    });
}

export function updateBattleFlow(id: string, moved: LastMove): void {
    db.query("UPDATE Battles SET last_move = $last WHERE id = $id").run({ id, last: moved });
}

export function deleteBattleFlow(id: string): void {
    db.query("DELETE FROM Battles WHERE id = $id").run({ id });
}

export function getBattleFlow(id: string): BattleFlow | null {
    const flow = <{ to: string } | null>db.query("SELECT type, attacker, defender, last_move, to FROM Battles WHERE id = $id").get({ id });
    if (flow === null) return null;
    flow.to = <never>JSON.parse(flow.to);

    return <never>flow;
}

export function findFlowAsAttacker(guildAndMemberId: string): BattleFlow & { id: string } | null {
    const flow = <{ to: string } | null>db.query(`SELECT id, type, attacker, defender, last_move, to FROM Battles WHERE id LIKE '${guildAndMemberId}:%'`).get();
    if (flow === null) return null;
    flow.to = <never>JSON.parse(flow.to);

    return <never>flow;
}
