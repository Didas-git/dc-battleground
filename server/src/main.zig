const sqlite = @import("sqlite");
const uws = @import("zuws");
const std = @import("std");

const Board = @import("./models/board.zig");

const App = uws.App;
const Request = uws.Request;
const Response = uws.Response;

fn hello(res: *Response, req: *Request) void {
    _ = req;
    const str = "Hello World!\n";
    res.end(str, false);
}

pub fn main() !void {
    var gpa: std.heap.GeneralPurposeAllocator(.{}) = .init;
    const allocator = gpa.allocator();

    // const app: App = try .init();
    // defer app.deinit();

    const flags = sqlite.SQLITE_OPEN_CREATE | sqlite.SQLITE_OPEN_READWRITE;

    var db: ?*sqlite.sqlite3 = undefined;
    if (sqlite.sqlite3_open_v2("test.db", &db, flags, null) != sqlite.SQLITE_OK) return error.FailedToOpenDatabase;
    defer _ = sqlite.sqlite3_close_v2(db);

    const board = Board.init(db);
    defer board.deinit();

    board.spawnPlayer("player_id", 340, -6);
    board.generateChest("chest_id", 1, 350, -7);
    board.generateEnemy("enemy_id", 1, 345, -4, 1);
    board.insertLayerPortal("3423242:layer_id", 1, 900, 0, .forwards);

    std.debug.print("{any}\n", .{board.getPlayerPosition("player_id")});
    std.debug.print("{any}\n", .{board.updatePlayerPosition("player_id", 10, 10)});
    std.debug.print("{any}\n", .{board.getPlayerPosition("player_id")});
    std.debug.print("{any}\n", .{board.getPortalPosition("3423242", 1, .forwards)});
    std.debug.print("{any}\n", .{board.getEntityInPosition(allocator, 0, 0, 0)});
    std.debug.print("{any}\n", .{board.getEntityInPosition(allocator, 1, 10, 10)});
    std.debug.print("{s}\n", .{(try board.getEntityInPosition(allocator, 1, 10, 10)).Player.id});
    std.debug.print("{any}\n", .{board.getEntityInPosition(allocator, 1, 350, -7)});
    std.debug.print("{any}\n", .{board.getEntityInPosition(allocator, 1, 345, -4)});
    std.debug.print("{any}\n", .{board.getEntityInPosition(allocator, 1, 900, 0)});
    board.deletePlayer("player_id");
    std.debug.print("{any}\n", .{board.updatePlayerPosition("player_id", 1, 1)});

    // try app.get("/hello", hello)
    //     .listen(3000, null);
}
