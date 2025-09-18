const Database = @import("sqlite");
const globals = @import("globals");
const std = @import("std");

const settings = @import("settings").settings;

const Statement = Database.Statement;
const random = std.crypto.random;

const Board = @This();

insert: struct {
    player: Statement,
    generic: Statement,
},

get: struct {
    player: Statement,
    portal: Statement,
    entity: Statement,
},

update: struct {
    player: struct {
        position: Statement,
        layer: Statement,
    },
},

delete: struct {
    player: Statement,
    entity: Statement,
    all: Statement,
},

pub const PositionalData = struct {
    layer: u8,
    x: i64,
    y: i64,
};

pub const LayerPortalDirection = enum(i2) {
    backwards = -1,
    forwards = 1,
};

pub const EntityType = enum(u8) {
    Empty,
    Player,
    Enemy,
    Chest,
    LayerPortal,
};

pub const Entity = union(EntityType) {
    Empty: void,
    Player: struct {
        id: []const u8,
    },
    Enemy: struct {
        id: []const u8,
        /// Can never be 0
        enemy_id: i64,
    },
    Chest: struct {
        id: []const u8,
    },
    LayerPortal: struct {
        id: []const u8,
        to: LayerPortalDirection,
    },

    pub fn deinit(self: Entity, allocator: std.mem.Allocator) void {
        switch (self) {
            .Empty => {},
            inline else => |e| allocator.free(e.id),
        }
    }

    pub fn getBoardTile(self: Entity) []const u8 {
        return switch (self) {
            .Empty => comptime settings.board.entity_map.empty,
            .Player => comptime settings.board.entity_map.player,
            .Enemy => comptime settings.board.entity_map.enemy,
            .Chest => comptime settings.board.entity_map.chest,
            .LayerPortal => comptime settings.board.entity_map.layer,
        };
    }

    pub fn getBoardTileFromInt(id: u8) []const u8 {
        return switch (id) {
            0 => comptime settings.board.entity_map.empty,
            1 => comptime settings.board.entity_map.player,
            2 => comptime settings.board.entity_map.enemy,
            3 => comptime settings.board.entity_map.chest,
            4 => comptime settings.board.entity_map.layer,
            99 => comptime settings.board.entity_map.enemy_player,
            else => unreachable,
        };
    }
};

pub const ChestRarity = enum {
    Cursed,
    Basic,
    Normal,
    Epic,
    Legendary,

    pub fn ratio(self: *ChestRarity) f64 {
        return switch (self) {
            .Cursed => 0.015,
            .Basic => 0.3,
            .Normal => 0.58,
            .Epic => 0.1,
            .Legendary => 0.005,
        };
    }

    pub fn toString(self: *ChestRarity) []const u8 {
        return switch (self) {
            .Cursed => "Cursed",
            .Basic => "Basic",
            .Normal => "Normal",
            .Epic => "Epic",
            .Legendary => "Legendary",
        };
    }
};

pub fn init(db: *Database) !Board {
    _ = try db.exec(
        \\CREATE TABLE IF NOT EXISTS Board (
        \\server_id TEXT NOT NULL,
        \\id TEXT NOT NULL,
        \\type INTEGER NOT NULL,
        \\layer INTEGER NOT NULL,
        \\x INTEGER NOT NULL,
        \\y INTEGER NOT NULL,
        \\extra INTEGER,
        \\PRIMARY KEY (server_id, id)
        \\UNIQUE(layer,x,y)
        \\)
    );

    return .{
        .insert = .{
            .player = try .init(db, "INSERT INTO Board (server_id, id, type, layer, x, y) VALUES (:server_id, :id, :type, 1, :x, :y)"),
            .generic = try .init(db, "INSERT OR IGNORE INTO Board (server_id, id, type, layer, x, y, extra) VALUES (:server_id, :id, :type, :layer, :x, :y, :extra)"),
        },
        .get = .{
            .player = try .init(db, "SELECT layer, x, y FROM Board WHERE server_id = :server_id AND id = :id"),
            .portal = try .init(db, "SELECT layer, x, y FROM Board WHERE server_id = :server_id AND layer = :layer AND extra = :to"),
            .entity = try .init(db, "SELECT type, id, extra FROM Board WHERE server_id = :server_id AND layer = :layer AND x = :x AND y = :y"),
            // .all = try .init(db, "SELECT x, y FROM BOARD WHERE server_id = :server_id AND layer = :layer AND type = 1"),
        },
        .update = .{
            .player = .{
                .position = try .init(db, "UPDATE Board SET x = :x, y = :y WHERE server_id = :server_id AND id = :id"),
                .layer = try .init(db, "UPDATE Board SET layer = :layer WHERE server_id = :server_id AND id = :id"),
            },
        },
        .delete = .{
            .player = try .init(db, "DELETE FROM Board WHERE server_id = :server_id AND id = :id"),
            .entity = try .init(db, "DELETE FROM Board WHERE server_id = :server_id AND layer = :layer AND x = :x AND y = :y"),
            .all = try .init(db, "DELETE FROM Board WHERE server_id = :server_id AND layer = :layer AND type != 1"),
        },
    };
}

pub const Coordinates = struct { x: i64, y: i64 };

pub fn generateRandomCoordinates(x: i64, y: i64) Coordinates {
    return .{
        .x = random.intRangeAtMost(i64, -x, x),
        .y = random.intRangeAtMost(i64, -y, y),
    };
}

pub fn spawnPlayer(self: *const Board, server_id: []const u8, member_id: []const u8) !PositionalData {
    const BoardLayer = globals.BoardLayer;
    const query = self.insert.player;
    defer _ = query.reset() catch unreachable;

    // TODO: Optimize spawn algorithm
    var x: i64 = 0;
    var y: i64 = 0;

    const limits = (try BoardLayer.getBoardLayerInfo(globals.allocator, 1)).?;

    while (true) {
        const coordinates = generateRandomCoordinates(limits.x, limits.y);
        const entity = try self.getEntityInPosition(globals.allocator, server_id, 1, coordinates.x, coordinates.y);
        if (entity == .Empty) {
            x = coordinates.x;
            y = coordinates.y;
            break;
        }
    }

    try query.bindText(1, server_id);
    try query.bindText(2, member_id);
    try query.bindInt(3, @intFromEnum(Entity.Player));
    try query.bindInt(4, x);
    try query.bindInt(5, y);

    _ = try query.step();

    return .{
        .layer = 1,
        .x = x,
        .y = y,
    };
}

pub fn generateChest(self: *const Board, server_id: []const u8, chest_id: []const u8, layer: u8, x: i64, y: i64) !void {
    const query = self.insert.generic;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindText(2, chest_id);
    try query.bindInt(3, @intFromEnum(Entity.Chest));
    try query.bindInt(4, layer);
    try query.bindInt(5, x);
    try query.bindInt(6, y);

    _ = try query.step();
}

pub fn generateEnemy(
    self: *const Board,
    server_id: []const u8,
    enemy_id: []const u8,
    layer: u8,
    x: i64,
    y: i64,
    identifier: u16,
) !void {
    const query = self.insert.generic;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindText(2, enemy_id);
    try query.bindInt(3, @intFromEnum(Entity.Enemy));
    try query.bindInt(4, layer);
    try query.bindInt(5, x);
    try query.bindInt(6, y);
    try query.bindInt(7, identifier);

    _ = try query.step();
}

pub fn insertLayerPortal(
    self: *const Board,
    server_id: []const u8,
    layer_id: []const u8,
    layer: u8,
    x: i64,
    y: i64,
    to: LayerPortalDirection,
) !void {
    const query = self.insert.generic;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindText(2, layer_id);
    try query.bindInt(3, @intFromEnum(Entity.LayerPortal));
    try query.bindInt(4, layer);
    try query.bindInt(5, x);
    try query.bindInt(6, y);
    try query.bindInt(7, @intFromEnum(to));

    _ = try query.step();
}

pub fn updatePlayerPosition(self: *const Board, server_id: []const u8, member_id: []const u8, x: i64, y: i64) !bool {
    const query = self.update.player.position;
    defer _ = query.reset() catch unreachable;

    try query.bindInt(1, x);
    try query.bindInt(2, y);
    try query.bindText(3, server_id);
    try query.bindText(4, member_id);

    _ = try query.step();

    if (query.changes() > 0) {
        return true;
    }

    return false;
}

pub fn changePlayerLayer(self: *const Board, server_id: []const u8, member_id: []const u8, layer: u8) !bool {
    const query = self.update.player.layer;
    defer _ = query.reset() catch unreachable;

    try query.bindInt(1, layer);
    try query.bindText(2, server_id);
    try query.bindText(3, member_id);

    _ = try query.step();

    if (query.changes() > 0) {
        return true;
    }

    return false;
}

pub fn getPlayerPosition(self: *const Board, server_id: []const u8, member_id: []const u8) !?PositionalData {
    const query = self.get.player;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindText(2, member_id);

    const result = try query.step();
    if (result != .row) return null;

    return .{
        .layer = @intCast(query.intColumn(0)),
        .x = @intCast(query.intColumn(1)),
        .y = @intCast(query.intColumn(2)),
    };
}

// TODO: Rework as deleteUsingID or something similar
pub fn deletePlayer(self: *const Board, server_id: []const u8, member_id: []const u8) !void {
    const query = self.delete.player;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindText(2, member_id);

    _ = try query.step();
}

pub fn getPortalPosition(self: *const Board, server_id: []const u8, layer: u8, direction: LayerPortalDirection) !?PositionalData {
    const query = self.get.portal;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindInt(2, layer);
    try query.bindInt(3, @intFromEnum(direction));

    const result = try query.step();
    if (result != .row) return null;

    return .{
        .layer = @intCast(query.intColumn(0)),
        .x = @intCast(query.intColumn(1)),
        .y = @intCast(query.intColumn(2)),
    };
}

/// The allocator is necessary to hold onto the `id`
/// Its up for the caller to deinit the memory using `Entity.deinit(allocator)` or use an arena allocator
pub fn getEntityInPosition(
    self: *const Board,
    allocator: std.mem.Allocator,
    server_id: []const u8,
    layer: u8,
    x: i64,
    y: i64,
) !Entity {
    const query = self.get.entity;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindInt(2, layer);
    try query.bindInt(3, x);
    try query.bindInt(4, y);

    const result = try query.step();
    if (result != .row) return .{ .Empty = {} };

    const entity_type: EntityType = @enumFromInt(query.intColumn(0));
    const id = try query.textColumn(allocator, 1);
    const extra = query.intColumn(2);

    return switch (entity_type) {
        .Empty => unreachable,
        .Enemy => .{ .Enemy = .{ .id = id, .enemy_id = extra } },
        .LayerPortal => .{ .LayerPortal = .{ .id = id, .to = @enumFromInt(extra) } },
        inline else => |e| {
            return @unionInit(Entity, @tagName(e), .{ .id = id });
        },
    };
}

pub fn deleteEntityInPosition(self: *const Board, server_id: []const u8, layer: u8, x: i32, y: i32) !void {
    const query = self.delete.entity;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindInt(2, layer);
    try query.bindInt(3, x);
    try query.bindInt(4, y);

    _ = try query.step();
}

pub fn wipeLayer(self: *const Board, server_id: []const u8, layer: u8) !void {
    const query = self.delete.all;
    defer _ = query.reset() catch unreachable;

    try query.bindText(1, server_id);
    try query.bindInt(2, layer);

    _ = try query.step();
}

/// Caller should use an arena allocator to be able to deinit all entities at once.
pub fn scanFromCenter(
    self: *const Board,
    allocator: std.mem.Allocator,
    server_id: []const u8,
    member_id: []const u8,
    center: PositionalData,
    size: u16,
) ![][]const u8 {
    const full_size = size * size;
    var board: std.ArrayList([]const u8) = try .initCapacity(allocator, full_size + size - 1);

    const initial_x: i64 = center.x - (size / 2);
    const initial_y: i64 = center.y + (size / 2);

    var i: usize = 0;
    var x = initial_x;
    var y = initial_y;
    while (i < full_size) : (i += 1) {
        if (i % size == 0 and i != 0) {
            try board.append(allocator, "\n");
            x = initial_x;
            y -= 1;
        }

        const entity = try self.getEntityInPosition(allocator, server_id, center.layer, x, y);
        try board.append(allocator, switch (entity) {
            .Player => |player| if (std.mem.eql(u8, member_id, player.id)) entity.getBoardTile() else Entity.getBoardTileFromInt(99),
            else => entity.getBoardTile(),
        });

        x += 1;
    }

    return board.toOwnedSlice(allocator);
}
