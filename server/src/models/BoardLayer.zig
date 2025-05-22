const std = @import("std");

const settings = @import("../settings.zig").settings;

const Database = @import("../sqlite/Database.zig");
const Statement = Database.Statement;

const BoardLayer = @This();

queries: struct {
    initialize: Statement,
    get: Statement,
    create: Statement,
    delete: Statement,
},

pub const Data = struct {
    layer: u8,
    name: []const u8,
    loot_table: ?[]const u8,
    x: u32,
    y: u32,
    previous: ?u8,
    next: ?u8,

    pub fn deinit(self: *Data, allocator: std.mem.Allocator) void {
        allocator.free(self.name);
    }
};

pub fn init(db: *Database) BoardLayer {
    db.exec(
        \\CREATE TABLE IF NOT EXISTS BoardLayer (
        \\layer INTEGER PRIMARY KEY,
        \\name TEXT NOT NULL,
        \\loot_table TEXT,
        \\x INTEGER NOT NULL,
        \\y INTEGER NOT NULL,
        \\previous INTEGER,
        \\next INTEGER,
        \\FOREIGN KEY(previous) REFERENCES BoardLayer(layer)
        \\FOREIGN KEY(next) REFERENCES BoardLayer(layer)
        \\)
    );

    return .{
        .queries = .{
            .initialize = .init(db, "SELECT layer FROM BoardLayer WHERE layer = :layer"),
            .get = .init(db, "SELECT name, layer, x, y, previous, next FROM BoardLayer WHERE layer = :layer"),
            .delete = .init(db, "DELETE FROM BoardLayer WHERE layer = :layer"),
            .create = .init(db, "INSERT INTO BoardLayer (layer, name, loot_table, x, y, previous, next) VALUES (:layer, :name, :table, :x, :y, :previousLayer, :nextLayer)"),
        },
    };
}

// Use an arena allocator to free everything at once
pub fn parseLayerSettings(self: *BoardLayer) void {
    const get_query = self.queries.initialize;
    const del_query = self.queries.delete;

    const len = settings.floors.len;

    var i: u8 = 0;
    while (true) : (i += 1) {
        defer get_query.reset();
        defer del_query.reset();
        get_query.bindInt(1, i);
        del_query.bindInt(1, i);

        const found = get_query.step();
        // There is probably a way to condensate this if statements
        if (i >= len and !found) break;
        _ = del_query.step();
        if (i >= len and found) continue;

        const layer = settings.floors[i];
        // TODO: implement string splitting like in the js version
        const x = layer.size;
        const y = layer.size;

        const previous_layer: ?u8 = if (i -| 1 == 0) null else i - 1;
        const next_layer: ?u8 = if (i + 1 == 1) null else if (i + 1 >= len) null else i + 1;

        self.createBoardLayer(
            i,
            layer.name,
            x,
            y,
            previous_layer,
            next_layer,
        );
    }
}

// Caller must call `Data.deinit(allocator)`
pub fn getBoardLayerInfo(self: *BoardLayer, allocator: std.mem.Allocator, layer: u8) !Data {
    const query = self.queries.get;
    defer query.reset();

    query.bindInt(1, layer);

    const found = query.step();

    if (!found) return null;

    const name = query.textColumn(0);

    const id_len = std.mem.len(name);
    const new_memory = try allocator.alloc(u8, id_len);
    @memcpy(new_memory, name[0..id_len]);

    return .{
        .name = new_memory,
        .layer = query.intColumn(1),
        .loot_table = null,
        .x = @intCast(query.intColumn(2)),
        .y = @intCast(query.intColumn(3)),
        .previous = query.intColumn(4),
        .next = query.intColumn(5),
    };
}

pub fn createBoardLayer(
    self: *BoardLayer,
    layer: u8,
    name: []const u8,
    x: u32,
    y: u32,
    previous_layer: ?u8,
    next_layer: ?u8,
) void {
    const query = self.queries.create;
    defer query.reset();

    query.bindInt(1, layer);
    query.bindText(2, name);
    query.bindNull(3);
    query.bindInt(4, x);
    query.bindInt(5, y);
    if (previous_layer) |prev| query.bindInt(6, prev) else query.bindNull(6);
    if (next_layer) |next| query.bindInt(7, next) else query.bindNull(7);

    _ = query.step();
}

pub fn calculateLayerSize(self: *BoardLayer, coordinates: Data) i32 {
    _ = self;
    return (coordinates.x - (coordinates.x * -1)) * (coordinates.y - (coordinates.y * -1));
}
