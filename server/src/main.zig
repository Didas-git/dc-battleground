const Database = @import("sqlite");
const zuws = @import("zuws");
const std = @import("std");

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

    globals.Board = .init(&db);
    globals.Player = .init(&db);
    globals.BoardCache = .init(&db);
    globals.BoardLayer = .init(&db);

    globals.BoardLayer.parseLayerSettings();

    globals.Board.insertLayerPortal("test_guild", "test_portal", 1, 1, 0, .forwards);
    globals.BoardCache.set("maybe", "didas");

    // Enable later in prod
    // globals.db.exec("PRAGMA journal_mode = WAL");
    // globals.db.exec("PRAGMA synchronous = NORMAL");

    app.comptimeGroup(&api);
    try app.listen(3001, null);
}
