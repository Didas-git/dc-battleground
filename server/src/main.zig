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

    globals.db = try .init("test.db", .{});
    defer globals.db.deinit();

    globals.Board = .init(&globals.db);
    globals.BoardCache = .init(&globals.db);
    globals.BoardLayer = .init(&globals.db);

    globals.BoardLayer.parseLayerSettings();

    globals.Board.spawnPlayer("didas", 0, 0);
    globals.Board.insertLayerPortal("test_portal", 1, 1, 0, .forwards);
    globals.BoardCache.set("maybe", "didas");

    // Enable later in prod
    // globals.db.exec("PRAGMA journal_mode = WAL");
    // globals.db.exec("PRAGMA synchronous = NORMAL");

    app.comptimeGroup(&api);
    try app.listen(3000, null);
}
