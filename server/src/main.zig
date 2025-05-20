const std = @import("std");
const sqlite = @import("sqlite");
const uws = @import("zuws");

const App = uws.App;
const Request = uws.Request;
const Response = uws.Response;

fn hello(res: *Response, req: *Request) void {
    _ = req;
    const str = "Hello World!\n";
    res.end(str, false);
}

const Statement = struct {
    stmt: ?*sqlite.sqlite3_stmt,

    fn init(db: ?*sqlite.sqlite3, query: [:0]const u8) Statement {
        var stmt: ?*sqlite.sqlite3_stmt = undefined;
        const result = sqlite.sqlite3_prepare(db.?, query, @intCast(query.len), &stmt, undefined);

        // TODO: Improve error handling, maybe cast it to a proper enum (?)
        if (result != sqlite.SQLITE_OK) {}
        return .{
            .stmt = stmt,
        };
    }

    fn step(self: *const Statement) void {
        const result = sqlite.sqlite3_step(self.stmt);
        // TODO: Improve error handling
        if (result != sqlite.SQLITE_DONE) {}
    }

    fn clear(self: *const Statement) void {
        const result = sqlite.sqlite3_clear_bindings(self.stmt);
        // TODO: Improve error handling
        if (result != sqlite.SQLITE_OK) {}
    }

    fn reset(self: *const Statement) void {
        const result = sqlite.sqlite3_reset(self.stmt);
        // TODO: Improve error handling
        if (result != sqlite.SQLITE_OK) {}
    }

    fn clearAndReset(self: *const Statement) void {
        self.clear();
        self.reset();
    }

    fn deinit(self: *const Statement) void {
        const result = sqlite.sqlite3_finalize(self.stmt);
        // TODO: Improve error handling
        if (result != sqlite.SQLITE_OK) {}
    }
};

pub fn main() !void {
    const app: App = try .init();
    defer app.deinit();

    const flags = sqlite.SQLITE_OPEN_CREATE | sqlite.SQLITE_OPEN_READWRITE;

    var db: ?*sqlite.sqlite3 = undefined;
    if (sqlite.sqlite3_open_v2("test.db", &db, flags, null) != sqlite.SQLITE_OK) return error.FailedToOpenDatabase;
    defer _ = sqlite.sqlite3_close_v2(db);

    const create_table = Statement.init(db, "CREATE TABLE IF NOT EXISTS Board (id TEXT PRIMARY KEY, type INTEGER NOT NULL, layer INTEGER NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL, data TEXT)");

    defer create_table.deinit();
    create_table.step();

    try app.get("/hello", hello)
        .listen(3000, null);
}
