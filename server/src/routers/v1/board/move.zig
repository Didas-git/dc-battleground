const zuws = @import("zuws");
const std = @import("std");

const db = @import("../../../main.zig");

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

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

var gpa: std.heap.GeneralPurposeAllocator(.{}) = .init;
const allocator = gpa.allocator();

const Direction = enum {
    left,
    up,
    down,
    right,
};

pub fn move(res: *Response, req: *Request) void {
    const Board = db.Board;
    const BoardCache = db.BoardCache;
    const BoardLayer = db.BoardLayer;

    const member_id = req.getParameter(0);
    const cache_id = req.getParameter(1);
    const direction_string = req.getParameter(2);
    const direction: Direction = @enumFromInt(std.fmt.parseInt(u8, direction_string, 10) catch {
        res.writeStatus("400 Malformed direction");
        res.endWithoutBody(true);
        return;
    });

    const cache_entry = BoardCache.get(allocator, cache_id) catch {
        return handleFailedAllocation(res);
    };

    if (cache_entry) |entry| {
        defer allocator.free(entry.member_id);
    } else {
        res.writeStatus("409 No Cache Entry");
        res.endWithoutBody(true);
        return;
    }

    const player = Board.getPlayerPosition(member_id) orelse {
        res.writeStatus("404 Not Found");
        res.endWithoutBody(true);
        return;
    };

    const x, const y = calculateCoordinates(player.x, player.y, direction);

    const entity = Board.getEntityInPosition(allocator, player.layer, x, y) catch {
        return handleFailedAllocation(res);
    };
    defer entity.deinit(allocator);

    switch (entity) {
        .Empty => {
            // TODO: Handle possible player missing
            // Tho realistically this race condition should never happen
            _ = Board.updatePlayerPosition(member_id, x, y);
            BoardCache.update(cache_id);
            res.writeStatus("200 Moved");
        },
        .Player => {
            res.writeStatus("204 Player battle not implemented");
        },
        .LayerPortal => |portal| {
            const next_layer: u8 = @intCast(@as(i16, player.layer) +| @intFromEnum(portal.to));
            const possible_new_layer = BoardLayer.getBoardLayerInfo(allocator, next_layer) catch {
                return handleFailedAllocation(res);
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
                    return handleFailedAllocation(res);
                };

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
                return handleFailedAllocation(res);
            };

            res.writeStatus("308 Next Action");
            res.writeHeader("Content-Type", "application/json; charset=utf8");
            res.end(stringified_data, true);
            return;
        },
    }

    res.endWithoutBody(true);
}

fn calculateCoordinates(x: i32, y: i32, direction: Direction) struct { i32, i32 } {
    return switch (direction) {
        .left => .{ x - 1, y },
        .up => .{ x, y + 1 },
        .down => .{ x, y - 1 },
        .right => .{ x + 1, y },
    };
}

fn handleFailedAllocation(res: *Response) void {
    res.writeStatus("500 Allocator shit the bed");
    res.endWithoutBody(true);
}
