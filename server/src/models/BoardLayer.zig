const Database = @import("sqlite");
const std = @import("std");

const settings = @import("settings").settings;

const Statement = Database.Statement;

const BoardLayer = @This();

queries: struct {
    search: Statement,
    get: Statement,
    create: Statement,
    delete: Statement,
},

pub const Info = struct {
    layer: u8,
    name: []const u8,
    loot_table: ?[]const u8,
    x: i32,
    y: i32,

    pub fn deinit(self: Info, allocator: std.mem.Allocator) void {
        allocator.free(self.name);
    }
};

pub fn init(db: *Database) !BoardLayer {
    _ = try db.exec(
        \\CREATE TABLE IF NOT EXISTS BoardLayer (
        \\layer INTEGER PRIMARY KEY,
        \\name TEXT NOT NULL,
        \\loot_table TEXT,
        \\x INTEGER NOT NULL,
        \\y INTEGER NOT NULL
        \\)
    );

    return .{
        .queries = .{
            .search = try .init(db, "SELECT layer FROM BoardLayer WHERE layer = :layer"),
            .get = try .init(db, "SELECT name, layer, x, y FROM BoardLayer WHERE layer = :layer"),
            .delete = try .init(db, "DELETE FROM BoardLayer WHERE layer = :layer"),
            .create = try .init(db, "INSERT INTO BoardLayer (layer, name, loot_table, x, y) VALUES (:layer, :name, :table, :x, :y)"),
        },
    };
}

// Use an arena allocator to free everything at once
pub fn parseLayerSettings(self: *BoardLayer) !void {
    const get_query = self.queries.search;
    const del_query = self.queries.delete;

    const len = settings.floors.len;

    var i: u8 = 0;
    while (true) : (i += 1) {
        defer _ = get_query.reset() catch unreachable;
        defer _ = del_query.reset() catch unreachable;
        try get_query.bindInt(1, i);
        try del_query.bindInt(1, i);

        const result = try get_query.step();
        // There is probably a way to condensate this if statements
        if (i >= len and result != .row) break;
        _ = try del_query.step();
        if (i >= len and result == .row) continue;

        const layer = settings.floors[i];
        // TODO: implement string splitting like in the js version
        const x = layer.size;
        const y = layer.size;

        try self.createBoardLayer(
            i,
            layer.name,
            x,
            y,
        );
    }
}

// Caller must call `Data.deinit(allocator)`
pub fn getBoardLayerInfo(self: *const BoardLayer, allocator: std.mem.Allocator, layer: u8) !?Info {
    const query = self.queries.get;
    defer _ = query.reset() catch unreachable;

    try query.bindInt(1, layer);

    const result = try query.step();
    if (result != .row) return null;

    const name = try query.textColumn(allocator, 0);

    return .{
        .name = name,
        .layer = @intCast(query.intColumn(1)),
        .loot_table = null,
        .x = @intCast(query.intColumn(2)),
        .y = @intCast(query.intColumn(3)),
    };
}

pub fn createBoardLayer(
    self: *BoardLayer,
    layer: u8,
    name: []const u8,
    x: u32,
    y: u32,
) !void {
    const query = self.queries.create;
    defer _ = query.reset() catch unreachable;

    try query.bindInt(1, layer);
    try query.bindText(2, name);
    try query.bindNull(3);
    try query.bindInt(4, x);
    try query.bindInt(5, y);

    _ = try query.step();
}

pub fn calculateLayerSize(coordinates: Info) i32 {
    return (coordinates.x - (coordinates.x * -1)) * (coordinates.y - (coordinates.y * -1));
}
