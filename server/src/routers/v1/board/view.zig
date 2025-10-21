const globals = @import("globals");
const models = @import("models");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const settings = @import("settings").settings;

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

pub fn view(res: *Response, req: *Request) void {
    const Board = globals.Board;

    const server_id = req.getParameter(0);
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
        break :blk comptime settings.board.view_size;
    };

    const position = Board.getPlayerPosition(server_id, member_id) catch {
        res.writeStatusCode(.InternalServerError);
        res.endWithoutBody(true);
        return;
    } orelse {
        res.writeStatusCode(.NotFound);
        res.endWithoutBody(true);
        return;
    };

    var arena = std.heap.ArenaAllocator.init(globals.allocator);
    defer arena.deinit();

    const allocator = arena.allocator();

    const entities = Board.scanFromCenter(allocator, server_id, position, view_size) catch {
        return utils.handleFailedAllocation(res);
    };

    var mapped_entities = std.ArrayList([]const u8).initCapacity(allocator, view_size * view_size + view_size - 1) catch {
        return utils.handleFailedAllocation(res);
    };

    for (entities, 0..) |entity, i| {
        if (i % view_size == 0 and i != 0) {
            mapped_entities.append(allocator, "\n") catch {
                return utils.handleFailedAllocation(res);
            };
        }
        mapped_entities.append(allocator, switch (entity) {
            .Player => |player| if (std.mem.eql(u8, member_id, player.id)) entity.getBoardTile() else models.Board.Entity.getBoardTileFromInt(99),
            else => entity.getBoardTile(),
        }) catch {
            return utils.handleFailedAllocation(res);
        };
    }

    const str = std.mem.concat(allocator, u8, mapped_entities.items) catch {
        return utils.handleFailedAllocation(res);
    };

    res.writeStatusCode(.OK);
    res.end(str, true);
}
