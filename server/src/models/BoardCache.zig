const Database = @import("sqlite");
const std = @import("std");

const Statement = Database.Statement;

const random = std.crypto.random;

const BoardCache = @This();

queries: struct {
    set: Statement,
    get: Statement,
    update: Statement,
    get_member: Statement,
    delete: Statement,
},

pub fn init(db: *Database) !BoardCache {
    _ = try db.exec(
        \\CREATE TABLE IF NOT EXISTS BoardCache (
        \\id TEXT PRIMARY KEY,
        \\member_id TEXT NOT NULL,
        \\added_at INTEGER NOT NULL
        \\)
    );

    return .{
        .queries = .{
            .set = try .init(db, "INSERT INTO BoardCache (id, member_id, added_at) VALUES (:id, :memberId, :addedAt)"),
            .get = try .init(db, "SELECT member_id, added_at FROM BoardCache WHERE id = :id"),
            .update = try .init(db, "UPDATE BoardCache SET added_at = :addedAt WHERE id = :id"),
            .get_member = try .init(db, "SELECT id, added_at FROM BoardCache WHERE member_id = :memberId"),
            .delete = try .init(db, "DELETE FROM BoardCache WHERE member_id = :memberId"),
        },
    };
}

pub fn set(self: *const BoardCache, cache_id: []const u8, member_id: []const u8) !void {
    const query = self.queries.set;

    try query.bindText(1, cache_id);
    try query.bindText(2, member_id);
    try query.bindInt(3, std.time.milliTimestamp());

    _ = try query.step();
    _ = try query.reset();
}

/// The caller should free `member_id`
pub fn get(self: *const BoardCache, allocator: std.mem.Allocator, cache_id: []const u8) !?struct { member_id: []const u8, added_at: i64 } {
    const query = self.queries.get;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, cache_id);

    const result = try query.step();
    if (result != .row) return null;

    const member_id = try query.textColumn(allocator, 0);

    return .{
        .member_id = member_id,
        .added_at = query.intColumn(1),
    };
}

pub fn update(self: *const BoardCache, cache_id: []const u8) !void {
    const query = self.queries.update;
    defer _ = query.reset() catch unreachable;

    try query.bindInt(1, std.time.milliTimestamp());
    try query.bindText(2, cache_id);

    _ = try query.step();
}
