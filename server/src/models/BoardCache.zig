const sqlite = @import("sqlite");
const std = @import("std");

const Statement = @import("../Statement.zig");

const random = std.crypto.random;

const BoardCache = @This();

queries: struct {
    set: Statement,
    get: Statement,
    update: Statement,
    get_member: Statement,
    delete: Statement,
},

pub fn init(db: ?*sqlite.sqlite3) BoardCache {
    const create_table = Statement.init(db,
        \\CREATE TABLE IF NOT EXISTS BoardCache (
        \\id TEXT PRIMARY KEY,
        \\member_id TEXT NOT NULL,
        \\added_at INTEGER NOT NULL
        \\)
    );

    defer create_table.deinit();
    _ = create_table.step();

    return .{
        .set = Statement.init(db, "INSERT INTO BoardCache (id, member_id, added_at) VALUES (:id, :memberId, :addedAt)"),
        .get = Statement.init(db, "SELECT member_id, added_at FROM BoardCache WHERE id = :id"),
        .update = Statement.init(db, "UPDATE BoardCache SET added_at = :addedAt WHERE id = :id"),
        .get_member = Statement.init(db, "SELECT id, added_at FROM BoardCache WHERE member_id = :memberId"),
        .delete = Statement.init(db, "DELETE FROM BoardCache WHERE member_id = :memberId"),
    };
}
