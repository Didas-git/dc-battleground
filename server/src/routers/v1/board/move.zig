const globals = @import("globals");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

const NextMoveData = struct {
    entity: u8,
    direction: u8,
    layer: u8,
    x: i32,
    y: i32,
};

const NextMoveLayerData = struct {
    entity: u8,
    direction: u8,
    layer: u8,
    x: i32,
    y: i32,
    next_layer: struct {
        name: []const u8,
    },
};

const Direction = enum {
    left,
    up,
    down,
    right,
};

pub fn move(res: *Response, req: *Request) void {
    const Board = globals.Board;
    const BoardCache = globals.BoardCache;
    const BoardLayer = globals.BoardLayer;

    const allocator = globals.allocator;

    const server_id = req.getParameter(0);
    const member_id = req.getParameter(1);
    const cache_id = req.getParameter(2);
    const direction_string = req.getParameter(3);
    const direction = std.meta.intToEnum(Direction, std.fmt.parseInt(u8, direction_string, 10) catch {
        res.writeStatus("400 Malformed direction");
        res.endWithoutBody(true);
        return;
    }) catch {
        res.writeStatus("400 Invalid Direction");
        res.endWithoutBody(true);
        return;
    };

    const cache_entry = BoardCache.get(allocator, cache_id) catch {
        return utils.handleFailedAllocation(res);
    };

    if (cache_entry) |entry| {
        defer allocator.free(entry.member_id);
    } else {
        res.writeStatus("409 No Cache Entry");
        res.endWithoutBody(true);
        return;
    }

    const player = Board.getPlayerPosition(server_id, member_id) catch {
        res.writeStatusCode(.InternalServerError);
        res.endWithoutBody(true);
        return;
    } orelse {
        res.writeStatusCode(.NotFound);
        res.endWithoutBody(true);
        return;
    };

    const x, const y = calculateCoordinates(player.x, player.y, direction);

    const entity = Board.getEntityInPosition(allocator, server_id, player.layer, x, y) catch {
        return utils.handleFailedAllocation(res);
    };
    defer entity.deinit(allocator);

    switch (entity) {
        .Empty => {
            // TODO: Handle possible player missing
            // Tho realistically this race condition should never happen
            _ = Board.updatePlayerPosition(server_id, member_id, x, y) catch {
                res.writeStatusCode(.InternalServerError);
                res.endWithoutBody(true);
                return;
            };
            BoardCache.update(cache_id) catch {
                res.writeStatusCode(.InternalServerError);
                res.endWithoutBody(true);
                return;
            };
            res.writeStatus("200 Moved");
        },
        .Player => {
            res.writeStatus("204 Player battle not implemented");
        },
        .LayerPortal => |portal| {
            const next_layer: u8 = @intCast(@as(i16, player.layer) +| @intFromEnum(portal.to));
            const possible_new_layer = BoardLayer.getBoardLayerInfo(allocator, next_layer) catch {
                return utils.handleFailedAllocation(res);
            };

            if (possible_new_layer) |new_layer| {
                defer new_layer.deinit(allocator);
                // TODO: Use HBP instead of JSON
                const stringified_data = std.json.stringifyAlloc(allocator, NextMoveLayerData{
                    .entity = @intFromEnum(entity),
                    .direction = @intFromEnum(direction),
                    .layer = player.layer,
                    .x = x,
                    .y = y,
                    .next_layer = .{
                        .name = new_layer.name,
                    },
                }, .{}) catch {
                    return utils.handleFailedAllocation(res);
                };
                defer allocator.free(stringified_data);

                res.writeStatus("308 Next Action");
                res.writeHeader("Content-Type", "application/json; charset=utf8");
                res.end(stringified_data, true);
                return;
            } else {
                // This should never happen
                res.writeStatus("503 This portal should not exist");
            }
        },
        else => {
            const stringified_data = std.json.stringifyAlloc(allocator, NextMoveData{
                .entity = @intFromEnum(entity),
                .direction = @intFromEnum(direction),
                .layer = player.layer,
                .x = x,
                .y = y,
            }, .{}) catch {
                return utils.handleFailedAllocation(res);
            };
            defer allocator.free(stringified_data);

            res.writeStatus("308 Next Action");
            res.writeHeader("Content-Type", "application/json; charset=utf8");
            res.end(stringified_data, true);
            return;
        },
    }

    var buff: [24]u8 = undefined;
    const str = std.fmt.bufPrint(&buff, "{d},{d}", .{ x, y }) catch {
        return utils.handleFailedAllocation(res);
    };

    res.end(str, true);
}

fn calculateCoordinates(x: i32, y: i32, direction: Direction) struct { i32, i32 } {
    return switch (direction) {
        .left => .{ x - 1, y },
        .up => .{ x, y + 1 },
        .down => .{ x, y - 1 },
        .right => .{ x + 1, y },
    };
}
