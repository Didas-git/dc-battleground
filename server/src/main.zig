const std = @import("std");
const c = @cImport(@cInclude("sqlite3.h"));

const Statement = struct {
    stmt: ?*c.sqlite3_stmt,

    fn init(db: ?*c.sqlite3, query: [:0]const u8) Statement {
        var stmt: ?*c.sqlite3_stmt = undefined;
        const result = c.sqlite3_prepare(db, query, @intCast(query.len), &stmt, undefined);

        // TODO: Improve error handling, maybe cast it to a proper enum (?)
        if (result != c.SQLITE_OK) {}
        return .{
            .stmt = stmt,
        };
    }

    fn step(self: *const Statement) void {
        const result = c.sqlite3_step(self.stmt);
        // TODO: Improve error handling
        if (result != c.SQLITE_DONE) {}
    }

    fn clear(self: *const Statement) void {
        const result = c.sqlite3_clear_bindings(self.stmt);
        // TODO: Improve error handling
        if (result != c.SQLITE_OK) {}
    }

    fn reset(self: *const Statement) void {
        const result = c.sqlite3_reset(self.stmt);
        // TODO: Improve error handling
        if (result != c.SQLITE_OK) {}
    }

    fn clearAndReset(self: *const Statement) void {
        self.clear();
        self.reset();
    }

    fn deinit(self: *const Statement) void {
        const result = c.sqlite3_finalize(self.stmt);
        // TODO: Improve error handling
        if (result != c.SQLITE_OK) {}
    }
};

pub fn main() !void {
    const flags = c.SQLITE_OPEN_CREATE | c.SQLITE_OPEN_READWRITE;

    var db: ?*c.sqlite3 = undefined;
    if (c.sqlite3_open_v2("test.db", &db, flags, null) != c.SQLITE_OK) return error.FailedToOpenDatabase;
    defer _ = c.sqlite3_close_v2(db);

    const create_table = Statement.init(db, "CREATE TABLE IF NOT EXISTS Board (id TEXT PRIMARY KEY, type INTEGER NOT NULL, layer INTEGER NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL, data TEXT)");

    defer create_table.deinit();
    create_table.step();
}
