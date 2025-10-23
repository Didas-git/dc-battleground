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
    // delete: Statement,
},

pub fn init(db: *Database) !BoardCache {
    _ = try db.exec(
        \\CREATE TABLE IF NOT EXISTS BoardCache (
        \\server_id INT NOT NULL,
        \\id INT NOT NULL,
        \\member_id INT NOT NULL,
        \\added_at INT NOT NULL,
        \\PRIMARY KEY (server_id, id)
        \\)
    );

    return .{
        .queries = .{
            .set = try .init(db, "INSERT INTO BoardCache (server_id, id, member_id, added_at) VALUES (:server_id, :id, :m_id, :addedAt)"),
            .get = try .init(db, "SELECT member_id, added_at FROM BoardCache WHERE server_id = :server_id AND id = :id"),
            .update = try .init(db, "UPDATE BoardCache SET added_at = :addedAt WHERE server_id = :server_id AND id = :id"),
            .get_member = try .init(db, "SELECT id, added_at FROM BoardCache WHERE member_id = :memberId"),
            // .delete = try .init(db, "DELETE FROM BoardCache WHERE member_id = :memberId"),
        },
    };
}

pub fn set(self: *const BoardCache, server_id: u64, member_id: u64) !void {
    const query = self.queries.set;

    try query.bindUInt(1, server_id);
    try query.bindUInt(2, member_id);
    try query.bindUInt(3, member_id);
    try query.bindInt(4, std.time.milliTimestamp());

    _ = try query.step();
    _ = try query.reset();
}

/// The caller should free `member_id`
pub fn get(self: *const BoardCache, server_id: u64, member_id: u64) !?struct { member_id: u64, added_at: i64 } {
    const query = self.queries.get;
    defer _ = query.reset() catch unreachable;

    try query.bindUInt(1, server_id);
    try query.bindUInt(2, member_id);

    const result = try query.step();
    if (result != .row) return null;

    return .{
        .member_id = query.uIntColumn(0),
        .added_at = query.intColumn(1),
    };
}

pub fn update(self: *const BoardCache, server_id: u64, member_id: u64) !void {
    const query = self.queries.update;
    defer _ = query.reset() catch unreachable;

    try query.bindInt(1, std.time.milliTimestamp());
    try query.bindUInt(2, server_id);
    try query.bindUInt(3, member_id);

    _ = try query.step();
}
