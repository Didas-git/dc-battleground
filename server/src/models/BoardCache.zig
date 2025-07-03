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

pub fn init(db: *Database) BoardCache {
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
        .queries = .{
            .set = .init(db, "INSERT INTO BoardCache (id, member_id, added_at) VALUES (:id, :memberId, :addedAt)"),
            .get = .init(db, "SELECT member_id, added_at FROM BoardCache WHERE id = :id"),
            .update = .init(db, "UPDATE BoardCache SET added_at = :addedAt WHERE id = :id"),
            .get_member = .init(db, "SELECT id, added_at FROM BoardCache WHERE member_id = :memberId"),
            .delete = .init(db, "DELETE FROM BoardCache WHERE member_id = :memberId"),
        },
    };
}

pub fn set(self: *const BoardCache, cache_id: []const u8, member_id: []const u8) void {
    const query = self.queries.set;
    defer query.reset();

    query.bindText(1, cache_id);
    query.bindText(2, member_id);
    query.bindInt(3, std.time.milliTimestamp());

    _ = query.step();
}

/// The caller should free `member_id`
pub fn get(self: *const BoardCache, allocator: std.mem.Allocator, cache_id: []const u8) !?struct { member_id: []const u8, added_at: i64 } {
    const query = self.queries.get;
    defer query.reset();

    query.bindText(1, cache_id);

    const found = query.step();
    if (!found) return null;

    const member_id = query.textColumn(0);

    const id_len = std.mem.len(member_id);
    const new_memory = try allocator.alloc(u8, id_len);
    @memcpy(new_memory, member_id[0..id_len]);

    return .{
        .member_id = new_memory,
        .added_at = query.intColumn(1),
    };
}

pub fn update(self: *const BoardCache, message_id: []const u8) void {
    const query = self.queries.update;
    defer query.reset();

    query.bindInt(1, std.time.milliTimestamp());
    query.bindText(2, message_id);

    _ = query.step();
}
