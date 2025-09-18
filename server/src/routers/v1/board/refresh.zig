const globals = @import("globals");
const nanoid = @import("nanoid");
const models = @import("models");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const settings = @import("settings").settings;

const random = std.crypto.random;

const _Board = models.Board;
const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;
const Layer = models.BoardLayer;
const LayerInfo = Layer.Info;
const Coordinates = _Board.Coordinates;
const Entity = _Board.EntityType;

const generateRandomCoordinates = _Board.generateRandomCoordinates;

const Generated = struct {
    chests: u64,
    mobs: u64,
    took: u64,
};

pub fn refresh(res: *Response, req: *Request) void {
    const server_id = req.getParameter(0);
    const layer = std.fmt.parseInt(u8, req.getParameter(1), 10) catch {
        res.writeStatus("400 Malformed direction");
        res.endWithoutBody(true);
        return;
    };

    var generated: Generated = .{ .chests = 0, .mobs = 0, .took = 0 };

    if (layer == 0) {
        var i: u8 = 1;
        while (i < settings.floors.len) : (i += 1) {
            const gen = refreshLayer(server_id, i) catch |err| {
                return switch (err) {
                    error.NoLayerInfo => handleNoLayerInfo(res),
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
                error.NoLayerInfo => handleNoLayerInfo(res),
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

    const size = settings.floors[layer].size;
    var full_size: u64 = (size * 2) * (size * 2);
    var arr: std.ArrayList(Entity) = try .initCapacity(allocator, full_size);

    try Board.wipeLayer(server_id, layer);

    const layer_info = try BoardLayer.getBoardLayerInfo(allocator, layer) orelse return error.NoLayerInfo;
    const layer_size = Layer.calculateLayerSize(layer_info);

    const chest_quantity: u64 = @intFromFloat(@round(settings.refresh.chest * @as(f64, @floatFromInt(layer_size))));
    const mob_quantity: u64 = @intFromFloat(@round(settings.refresh.mob * @as(f64, @floatFromInt(layer_size))));

    var timer = try std.time.Timer.start();

    if (layer > 1) {
        const coordinates = try getCoordinates(allocator, layer_info, server_id);
        try Board.insertLayerPortal(server_id, &nanoid.generate(random), layer, coordinates.x, coordinates.y, .backwards);
    }

    if (layer < comptime settings.floors.len - 1) {
        const coordinates = try getCoordinates(allocator, layer_info, server_id);
        try Board.insertLayerPortal(server_id, &nanoid.generate(random), layer, coordinates.x, coordinates.y, .forwards);
    }

    for (0..chest_quantity) |_| {
        try arr.append(allocator, .Chest);
        full_size -= 1;
    }

    for (0..mob_quantity) |_| {
        try arr.append(allocator, .Enemy);
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
        const coordinates = calculateCoordinates(j);
        switch (entity) {
            // TODO: Pre generate chest rarities using the identifier/extra property
            .Chest => try Board.generateChest(server_id, &nanoid.generate(random), layer, coordinates.x, coordinates.y),
            // TODO: Properly generate enemy, aka randomize identifier and extract id from that
            .Enemy => try Board.generateEnemy(server_id, &nanoid.generate(random), layer, coordinates.x, coordinates.y, 0),
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

fn calculateCoordinates(index: usize) Coordinates {
    _ = index;
    // TODO
    return .{ .x = 0, .y = 0 };
}

fn getCoordinates(gpa: std.mem.Allocator, layer_info: LayerInfo, server_id: []const u8) !Coordinates {
    const Board = globals.Board;

    var coordinates = generateRandomCoordinates(layer_info.x, layer_info.y);
    var entity = try Board.getEntityInPosition(gpa, server_id, layer_info.layer, coordinates.x, coordinates.y);
    while (entity != .Empty) {
        coordinates = generateRandomCoordinates(layer_info.x, layer_info.y);
        entity.deinit(gpa);
        entity = try Board.getEntityInPosition(gpa, server_id, layer_info.layer, coordinates.x, coordinates.y);
    }

    return coordinates;
}

fn handleNoLayerInfo(res: *Response) void {
    res.writeStatusCode(.NotFound);
    res.endWithoutBody(true);
}
