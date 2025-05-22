const sqlite = @import("sqlite");
const zuws = @import("zuws");
const std = @import("std");

const Board = @import("./models/Board.zig");

const api = @import("./routers/api.zig").api;

const App = zuws.App;

pub fn main() !void {
    const app: App = try .init();
    defer {
        app.close();
        app.deinit();
    }

    const flags = sqlite.SQLITE_OPEN_CREATE | sqlite.SQLITE_OPEN_READWRITE;

    var db: ?*sqlite.sqlite3 = undefined;
    if (sqlite.sqlite3_open_v2("test.db", &db, flags, null) != sqlite.SQLITE_OK) return error.FailedToOpenDatabase;
    defer _ = sqlite.sqlite3_close_v2(db);

    const board = Board.init(db);
    defer board.deinit();

    app.comptimeGroup(&api);
    try app.listen(3000, null);
}
