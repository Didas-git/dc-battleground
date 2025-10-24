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
    globals.Board = try .init(&db);
    globals.Player = try .init(&db);
    globals.BoardCache = try .init(&db);
    globals.BoardLayer = try .init(&db);

    try globals.BoardLayer.parseLayerSettings();

    // Enable later in prod
    // db.exec("PRAGMA journal_mode = WAL");
    // db.exec("PRAGMA synchronous = NORMAL");

    app.comptimeGroup(&api);
    app.listen(3000, null);
    app.run();
}
