const globals = @import("globals");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const settings = @import("settings").settings;

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

pub fn scan(res: *Response, req: *Request) void {
    const Board = globals.Board;

    const server_id = std.fmt.parseInt(u64, req.getParameter(0), 10) catch {
        res.writeStatus("400 Malformed server_id");
        res.endWithoutBody(true);
        return;
    };

    const member_id = std.fmt.parseInt(u64, req.getParameter(1), 10) catch {
        res.writeStatus("400 Malformed member_id");
        res.endWithoutBody(true);
        return;
    };

    const scanner_radius_header = req.getHeader("scanner-radius");
    const scanner_radius = blk: {
        if (scanner_radius_header) |header| {
            break :blk std.fmt.parseInt(u16, header, 10) catch {
                res.writeStatus("400 Malformed Scanner-Radius Header");
                res.endWithoutBody(true);
                return;
            };
        }
        break :blk comptime settings.board.scan_radius;
    };

    const position = Board.getPlayerPosition(globals.allocator, server_id, member_id) catch {
        res.writeStatusCode(.InternalServerError);
        res.endWithoutBody(true);
        return;
    } orelse {
        res.writeStatusCode(.NotFound);
        res.endWithoutBody(true);
        return;
    };
    defer globals.allocator.free(position.name);

    var arena = std.heap.ArenaAllocator.init(globals.allocator);
    defer arena.deinit();

    const allocator = arena.allocator();

    const entities = Board.scanFromCenter(allocator, server_id, position, scanner_radius) catch {
        return utils.handleFailedAllocation(res);
    };

    var chest_count: u64 = 0;
    var mob_count: u64 = 0;
    var enemy_player_count: u64 = 0;

    for (entities) |entity| {
        switch (entity) {
            .chest => chest_count += 1,
            .mob => mob_count += 1,
            .player => |player| {
                if (member_id == player.id) continue;
                enemy_player_count += 1;
            },
            else => continue,
        }
    }

    const str = std.fmt.allocPrint(allocator, "{d},{d},{d}", .{ chest_count, mob_count, enemy_player_count }) catch {
        return utils.handleFailedAllocation(res);
    };

    res.writeStatusCode(.OK);
    res.end(str, true);
}
