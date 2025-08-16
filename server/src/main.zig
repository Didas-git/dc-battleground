const Database = @import("sqlite");
const zuws = @import("zuws");
const std = @import("std");
const builtin = @import("builtin");

const api = @import("./routers/api.zig").api;

const App = zuws.App;

const globals = @import("globals");

pub fn main() !void {
    const app: App = try .init();
    defer {
        app.close();
        app.deinit();
    }

    var db: Database = try .init("test.db", .{});
    defer db.deinit();

    globals.db = db;
    globals.Board = .init(&db);
    globals.Player = .init(&db);
    globals.BoardCache = .init(&db);
    globals.BoardLayer = .init(&db);

    globals.BoardLayer.parseLayerSettings();

    if (comptime builtin.mode == .Debug) {
        insertTestData();
    }

    // Enable later in prod
    // db.exec("PRAGMA journal_mode = WAL");
    // db.exec("PRAGMA synchronous = NORMAL");

    app.comptimeGroup(&api);
    try app.listen(3000, null);
}

fn insertTestData() void {
    globals.Board.insertLayerPortal("test_server", "test_portal", 1, 3, 0, .forwards);
    globals.BoardCache.set("test_cache", "didas");
}
