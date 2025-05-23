const zuws = @import("zuws");
const std = @import("std");

const Database = @import("./sqlite/Database.zig");
const _Board = @import("./models/Board.zig");
const _BoardCache = @import("./models/BoardCache.zig");
const _BoardLayer = @import("./models/BoardLayer.zig");

const api = @import("./routers/api.zig").api;

const App = zuws.App;

// There has to be a better way to do this an im just being blind
var db: Database = undefined;
pub var Board: _Board = undefined;
pub var BoardCache: _BoardCache = undefined;
pub var BoardLayer: _BoardLayer = undefined;

pub fn main() !void {
    const app: App = try .init();
    defer {
        app.close();
        app.deinit();
    }

    db = try .init("test.db", .{});
    defer db.deinit();

    Board = .init(&db);
    BoardCache = .init(&db);
    BoardLayer = .init(&db);

    BoardLayer.parseLayerSettings();

    Board.spawnPlayer("didas", 0, 0);
    Board.insertLayerPortal("test_portal", 1, 1, 0, .forwards);
    BoardCache.set("maybe", "didas");

    // Enable later in prod
    // db.exec("PRAGMA journal_mode = WAL");
    // db.exec("PRAGMA synchronous = NORMAL");

    app.comptimeGroup(&api);
    try app.listen(3000, null);
}
