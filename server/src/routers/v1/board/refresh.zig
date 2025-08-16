const globals = @import("globals");
const nanoid = @import("nanoid");
const models = @import("models");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const settings = @import("settings").settings;

const random = std.crypto.random;

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;
const Layer = models.BoardLayer;
const LayerInfo = Layer.Info;
const Coordinates = models.Board.Coordinates;

const generateRandomCoordinates = models.Board.generateRandomCoordinates;

const Generated = struct {
    chest: struct { count: u64, time: u64 },
    mob: struct { count: u64, time: u64 },
};

pub fn refresh(res: *Response, req: *Request) void {
    const server_id = req.getParameter(0);
    const layer = std.fmt.parseInt(u8, req.getParameter(1), 10) catch {
        res.writeStatus("400 Malformed direction");
        res.endWithoutBody(true);
        return;
    };

    var generated: Generated = .{ .chest = .{ .count = 0, .time = 0 }, .mob = .{ .count = 0, .time = 0 } };

    if (layer == 0) {
        var i: u8 = 1;
        while (i < settings.floors.len) : (i += 1) {
            const gen = refresh_layer(server_id, i) catch |err| {
                return switch (err) {
                    error.NoLayerInfo => handleNoLayerInfo(res),
                    else => utils.handleFailedAllocation(res),
                };
            };
            generated.chest.count += gen.chest.count;
            generated.mob.count += gen.mob.count;
            generated.chest.time += gen.chest.time;
            generated.mob.time += gen.mob.time;
        }
    } else {
        generated = refresh_layer(server_id, layer) catch |err| {
            return switch (err) {
                error.NoLayerInfo => handleNoLayerInfo(res),
                else => utils.handleFailedAllocation(res),
            };
        };
    }

    const stringified_data = std.json.stringifyAlloc(globals.allocator, generated, .{}) catch {
        return utils.handleFailedAllocation(res);
    };
    defer globals.allocator.free(stringified_data);

    res.writeStatusCode(.OK);
    res.end(stringified_data, true);
}

pub fn refresh_layer(server_id: []const u8, layer: u8) !Generated {
    const Board = globals.Board;
    const BoardLayer = globals.BoardLayer;

    try Board.wipeLayer(server_id, layer);

    const layer_info = try BoardLayer.getBoardLayerInfo(globals.allocator, layer) orelse return error.NoLayerInfo;
    const layer_size = Layer.calculateLayerSize(layer_info);

    const chest_quantity: u64 = @intFromFloat(@round(settings.refresh.chest * @as(f64, @floatFromInt(layer_size))));
    const mob_quantity: u64 = @intFromFloat(@round(settings.refresh.mob * @as(f64, @floatFromInt(layer_size))));

    if (layer > 1) {
        const coordinates = generateRandomCoordinates(layer_info.x, layer_info.y);
        try Board.insertLayerPortal(server_id, &nanoid.generate(random), layer, coordinates.x, coordinates.y, .backwards);
    }

    if (layer < comptime settings.floors.len - 1) {
        const coordinates = try getCoordinates(server_id, &layer_info);
        try Board.insertLayerPortal(server_id, &nanoid.generate(random), layer, coordinates.x, coordinates.y, .forwards);
    }

    var timer = try std.time.Timer.start();
    var i: usize = 0;
    while (i < chest_quantity) : (i += 1) {
        const coordinates = try getCoordinates(server_id, &layer_info);
        // TODO: Pre generate chest rarities using the identifier/extra property
        try Board.generateChest(server_id, &nanoid.generate(random), layer, coordinates.x, coordinates.y);
    }

    const chest_time = timer.lap();

    i = 0;
    while (i < mob_quantity) : (i += 1) {
        const coordinates = try getCoordinates(server_id, &layer_info);
        // TODO: Properly generate enemy, aka randomize identifier and extract id from that
        try Board.generateEnemy(server_id, &nanoid.generate(random), layer, coordinates.x, coordinates.y, 0);
    }

    const mob_time = timer.lap();

    return .{
        .chest = .{ .count = chest_quantity, .time = chest_time },
        .mob = .{ .count = mob_quantity, .time = mob_time },
    };
}

fn getCoordinates(server_id: []const u8, layer_info: *const LayerInfo) !Coordinates {
    const Board = globals.Board;

    var coordinates = generateRandomCoordinates(layer_info.x, layer_info.y);
    var entity = try Board.getEntityInPosition(globals.allocator, server_id, layer_info.layer, coordinates.x, coordinates.y);
    while (entity != .Empty) {
        coordinates = generateRandomCoordinates(layer_info.x, layer_info.y);
        entity.deinit(globals.allocator);
        entity = try Board.getEntityInPosition(globals.allocator, server_id, layer_info.layer, coordinates.x, coordinates.y);
    }

    return coordinates;
}

fn handleNoLayerInfo(res: *Response) void {
    res.writeStatusCode(.NotFound);
    res.endWithoutBody(true);
}
