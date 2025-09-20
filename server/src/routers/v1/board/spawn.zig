const globals = @import("globals");
const models = @import("models");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const shared = @import("./shared.zig");

const Request = zuws.Request;
const Response = zuws.Response;

pub fn spawn(res: *Response, req: *Request) void {
    const Board = globals.Board;
    const BoardLayer = globals.BoardLayer;
    const allocator = globals.allocator;

    const server_id = req.getParameter(0);
    const layer = std.fmt.parseInt(u8, req.getParameter(1), 10) catch {
        res.writeStatus("400 Malformed layer");
        res.endWithoutBody(true);
        return;
    };
    const entity_type = std.meta.intToEnum(models.Board.EntityType, std.fmt.parseInt(u8, req.getParameter(2), 10) catch {
        res.writeStatus("400 Malformed type");
        res.endWithoutBody(true);
        return;
    }) catch {
        res.writeStatus("400 Invalid type");
        res.endWithoutBody(true);
        return;
    };

    const spawn_amount = req.getHeader("spawn-amount");
    const amount = if (spawn_amount) |amt| std.fmt.parseInt(u32, amt, 10) catch {
        res.writeStatus("400 Malformed Spawn-Amount Header");
        res.endWithoutBody(true);
        return;
    } else {
        res.writeStatus("400 Missing Spawn-Amount Header");
        res.endWithoutBody(true);
        return;
    };

    if (layer == 0) {
        res.writeStatus("400 Invalid layer");
        res.endWithoutBody(true);
        return;
    }

    switch (entity_type) {
        .Enemy, .Chest => |entity| {
            const layer_info = BoardLayer.getBoardLayerInfo(allocator, layer) catch {
                return utils.handleFailedAllocation(res);
            } orelse {
                return shared.handleNoLayerInfo(res);
            };

            defer layer_info.deinit(allocator);

            // TODO: Make this faster/better
            for (0..amount) |_| {
                const coordinates = shared.getCoordinates(allocator, layer_info, server_id) catch {
                    return utils.handleFailedAllocation(res);
                };
                Board.generateEntity(entity, server_id, layer, coordinates.x, coordinates.y, null) catch {
                    res.writeStatus("500 An error occurred");
                    res.endWithoutBody(true);
                    return;
                };
            }

            res.writeStatusCode(.OK);
            res.endWithoutBody(true);
            return;
        },
        else => {
            res.writeStatus("400 Invalid type");
            res.endWithoutBody(true);
            return;
        },
    }
}
