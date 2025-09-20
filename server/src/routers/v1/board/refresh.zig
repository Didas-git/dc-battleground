const globals = @import("globals");
const models = @import("models");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const shared = @import("./shared.zig");

const settings = @import("settings").settings;

const random = std.crypto.random;

const App = zuws.App;
const _Board = models.Board;
const LayerInfo = Layer.Info;
const Request = zuws.Request;
const Response = zuws.Response;
const Layer = models.BoardLayer;
const Entity = _Board.EntityType;
const Coordinates = _Board.Coordinates;

const Generated = struct {
    chests: u64,
    mobs: u64,
    took: u64,
};

pub fn refresh(res: *Response, req: *Request) void {
    const server_id = req.getParameter(0);
    const layer = std.fmt.parseInt(u8, req.getParameter(1), 10) catch {
        res.writeStatus("400 Malformed layer");
        res.endWithoutBody(true);
        return;
    };

    var generated: Generated = .{ .chests = 0, .mobs = 0, .took = 0 };

    if (layer == 0) {
        var i: u8 = 1;
        while (i < settings.floors.len) : (i += 1) {
            const gen = refreshLayer(server_id, i) catch |err| {
                return switch (err) {
                    error.NoLayerInfo => shared.handleNoLayerInfo(res),
                    else => utils.handleFailedAllocation(res),
                };
            };
            generated.chests += gen.chests;
            generated.mobs += gen.mobs;
            generated.took += gen.took;
        }
    } else {
        generated = refreshLayer(server_id, layer) catch |err| {
            return switch (err) {
                error.NoLayerInfo => shared.handleNoLayerInfo(res),
                else => utils.handleFailedAllocation(res),
            };
        };
    }

    const stringified_data = std.json.Stringify.valueAlloc(globals.allocator, generated, .{}) catch {
        return utils.handleFailedAllocation(res);
    };
    defer globals.allocator.free(stringified_data);

    res.writeStatusCode(.OK);
    res.end(stringified_data, true);
}

pub fn refreshLayer(server_id: []const u8, layer: u8) !Generated {
    const Board = globals.Board;
    const BoardLayer = globals.BoardLayer;
    const allocator = globals.allocator;

    try Board.wipeLayer(server_id, layer);

    const layer_info = try BoardLayer.getBoardLayerInfo(allocator, layer) orelse return error.NoLayerInfo;
    defer layer_info.deinit(allocator);

    const layer_size = Layer.calculateLayerSize(layer_info);

    const chest_quantity: u64 = @intFromFloat(@round(settings.refresh.chest * @as(f64, @floatFromInt(layer_size))));
    const mob_quantity: u64 = @intFromFloat(@round(settings.refresh.mob * @as(f64, @floatFromInt(layer_size))));

    var full_size: u64 = layer_size;
    var arr: std.ArrayList(Entity) = try .initCapacity(allocator, full_size);

    var timer = try std.time.Timer.start();

    if (layer > 1) {
        const prev_layer_info = try BoardLayer.getBoardLayerInfo(allocator, layer - 1) orelse return error.NoLayerInfo;
        defer prev_layer_info.deinit(allocator);

        const coordinates = try shared.getCoordinates(allocator, layer_info, server_id);
        const id = try std.mem.join(allocator, "-", &.{ server_id, layer_info.name, "to", prev_layer_info.name });
        try Board.insertLayerPortal(server_id, id, layer, coordinates.x, coordinates.y, .backwards);
    }

    if (layer < comptime settings.floors.len - 1) {
        const next_layer_info = try BoardLayer.getBoardLayerInfo(allocator, layer + 1) orelse return error.NoLayerInfo;
        defer next_layer_info.deinit(allocator);

        const coordinates = try shared.getCoordinates(allocator, layer_info, server_id);
        const id = try std.mem.join(allocator, ":", &.{ server_id, layer_info.name, "to", next_layer_info.name });
        try Board.insertLayerPortal(server_id, id, layer, coordinates.x, coordinates.y, .forwards);
    }

    for (0..chest_quantity) |_| {
        try arr.append(allocator, .Chest);
        full_size -= 1;
    }

    for (0..mob_quantity) |_| {
        try arr.append(allocator, .Mob);
        full_size -= 1;
    }

    while (full_size > 0) : (full_size -= 1) {
        try arr.append(allocator, .Empty);
    }

    const buf = try arr.toOwnedSlice(allocator);
    random.shuffle(Entity, buf);

    _ = try globals.db.exec("BEGIN TRANSACTION");

    for (buf, 0..) |entity, j| {
        if (entity == .Empty) continue;
        const coordinates = calculateCoordinates(@intCast(j), layer_info.x, layer_info.y);
        switch (entity) {
            // TODO: Pre generate chest rarities using the identifier/extra property
            .Chest => try Board.generateEntity(.Chest, server_id, layer, coordinates.x, coordinates.y, null),
            // TODO: Properly generate enemy, aka randomize identifier and extract id from that
            .Mob => try Board.generateEntity(.Mob, server_id, layer, coordinates.x, coordinates.y, null),
            else => unreachable,
        }
    }

    _ = try globals.db.exec("END TRANSACTION");

    const time = timer.lap();

    return .{
        .chests = chest_quantity,
        .mobs = mob_quantity,
        .took = time,
    };
}

fn calculateCoordinates(index: i64, max_x: i64, max_y: i64) Coordinates {
    const min_x = -max_x;
    const stride: i64 = max_x - min_x + 1;

    const x = min_x + @mod(index, stride);
    const y = max_y - @divTrunc(index, stride);

    return .{ .x = x, .y = y };
}
