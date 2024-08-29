import { db } from "../db.js";

export interface BoardCacheEntry {
    member_id: string;
    added_at: string;
}

db.run("CREATE TABLE IF NOT EXISTS BoardCache ( id TEXT PRIMARY KEY, member_id TEXT NOT NULL, added_at INTEGER NOT NULL)");

export function set(id: string, memberId: `${string}:${string}`): void {
    db.query("INSERT INTO BoardCache (id, member_id, added_at) VALUES ($id, $memberId, $addedAt)").run({ id, memberId, addedAt: Date.now() });
}

export function get(id: string): BoardCacheEntry | null {
    return (<BoardCacheEntry>db.query("SELECT member_id, added_at FROM BoardCache WHERE id = $id").get({ id }));
}

export function del(memberId: `${string}:${string}`): void {
    db.query("DELETE FROM BoardCache WHERE member_id = $memberId").run({ memberId });
}
