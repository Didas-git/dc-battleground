import { db } from "../db.js";

export interface BoardCacheEntry {
    member_id: string;
    added_at: number;
}

db.run("CREATE TABLE IF NOT EXISTS BoardCache ( id TEXT PRIMARY KEY, member_id TEXT NOT NULL, added_at INTEGER NOT NULL)");

export function set(messageId: string, memberId: string): void {
    db.query("INSERT INTO BoardCache (id, member_id, added_at) VALUES ($id, $memberId, $addedAt)").run({ id: messageId, memberId, addedAt: Date.now() });
}

export function get(messageId: string): BoardCacheEntry | null {
    return (<BoardCacheEntry>db.query("SELECT member_id, added_at FROM BoardCache WHERE id = $id").get({ id: messageId }));
}

export function update(messageId: string): void {
    db.query("UPDATE BoardCache SET added_at = $addedAt WHERE id = $id").run({ id: messageId, addedAt: Date.now() });
}

export function getMember(memberId: string): { added_at: number, id: string } | null {
    return (<{ added_at: number, id: string }>db.query("SELECT id, added_at FROM BoardCache WHERE member_id = $memberId").get({ memberId }));
}

export function del(memberId: string): void {
    db.query("DELETE FROM BoardCache WHERE member_id = $memberId").run({ memberId });
}
