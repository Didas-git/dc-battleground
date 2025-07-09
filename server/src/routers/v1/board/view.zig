const globals = @import("globals");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const settings = @import("settings").settings;

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

pub fn view(res: *Response, req: *Request) void {
    const Board = globals.Board;

    const guild_id = req.getParameter(0);
    const member_id = req.getParameter(1);

    const view_size_header = req.getHeader("view-size");
    const view_size = blk: {
        if (view_size_header) |header| {
            break :blk std.fmt.parseInt(u16, header, 10) catch {
                res.writeStatus("400 Malformed View-Size Header");
                res.endWithoutBody(true);
                return;
            };
        }
        break :blk settings.board.view_size;
    };

    const position = Board.getPlayerPosition(guild_id, member_id) orelse {
        res.writeStatusCode(.NotFound);
        res.endWithoutBody(true);
        return;
    };

    var arena = std.heap.ArenaAllocator.init(globals.allocator);
    defer arena.deinit();

    const allocator = arena.allocator();

    const entities = Board.scanFromCenter(allocator, guild_id, member_id, position, view_size) catch {
        return utils.handleFailedAllocation(res);
    };

    const str = std.mem.concat(allocator, u8, entities) catch {
        return utils.handleFailedAllocation(res);
    };

    std.debug.print("STR: {s}\n", .{str});

    res.writeStatusCode(.OK);
    res.end(str, true);
}
