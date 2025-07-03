const Database = @import("sqlite");
const globals = @import("globals");
const std = @import("std");

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
},

pub const PositionalData = struct {
    layer: u8,
    x: i32,
    y: i32,
};

pub fn init(db: *Database) Board {
    db.exec(
        \\CREATE TABLE IF NOT EXISTS Board (
        \\guild_id TEXT NOT NULL,
        \\id TEXT NOT NULL,
        \\type INTEGER NOT NULL,
        \\layer INTEGER NOT NULL,
        \\x INTEGER NOT NULL,
        \\y INTEGER NOT NULL,
        \\extra INTEGER
        \\)
    );

    return .{
        .insert = .{
            .player = .init(db, "INSERT INTO Board (guild_id, id, type, layer, x, y) VALUES (:guild_id, :id, :type, 1, :x, :y)"),
            .generic = .init(db, "INSERT INTO Board (guild_id, id, type, layer, x, y, extra) VALUES (:guild_id, :id, :type, :layer, :x, :y, :extra)"),
        },
        .get = .{
            .player = .init(db, "SELECT layer, x, y FROM Board WHERE guild_id = :guild_id AND id = :id"),
            .portal = .init(db, "SELECT layer, x, y FROM Board WHERE guild_id = :guild_id AND layer = :layer AND extra = :to"),
            .entity = .init(db, "SELECT type, id, extra FROM Board WHERE guild_id = :guild_id AND layer = :layer AND x = :x AND y = :y"),
        },
        .update = .{
            .player = .{
                .position = .init(db, "UPDATE Board SET x = :x, y = :y WHERE guild_id = :guild_id AND id = :id"),
                .layer = .init(db, "UPDATE Board SET layer = :layer WHERE guild_id = :guild_id AND id = :id"),
            },
        },
        .delete = .{
            .player = .init(db, "DELETE FROM Board WHERE guild_id = :guild_id AND id = :id"),
            .entity = .init(db, "DELETE FROM Board WHERE guild_id = :guild_id AND layer = :layer AND x = :x AND y = :y"),
        },
    };
}

pub fn deinit(self: *const Board) void {
    inline for (comptime std.meta.fieldNames(@TypeOf(self.insert))) |name| {
        @field(self.insert, name).deinit();
    }
}

pub fn generateRandomCoordinates(x: i32, y: i32) struct { x: i32, y: i32 } {
    return .{
        .x = random.intRangeAtMost(i32, -x, x),
        .y = random.intRangeAtMost(i32, -y, y),
    };
}

pub fn spawnPlayer(self: *const Board, guild_id: []const u8, member_id: []const u8) !PositionalData {
    const BoardLayer = globals.BoardLayer;
    const query = self.insert.player;
    defer query.reset();

    // TODO: Optimize spawn algorithm
    var x: i32 = 0;
    var y: i32 = 0;

    const limits = (try BoardLayer.getBoardLayerInfo(globals.allocator, 1)).?;

    while (true) {
        const coordinates = generateRandomCoordinates(limits.x, limits.y);
        const entity = try self.getEntityInPosition(globals.allocator, guild_id, 1, coordinates.x, coordinates.y);
        if (entity == .Empty) {
            x = coordinates.x;
            y = coordinates.y;
            break;
        }
    }

    query.bindText(1, guild_id);
    query.bindText(2, member_id);
    query.bindInt(3, @intFromEnum(Entity.Player));
    query.bindInt(4, x);
    query.bindInt(5, y);

    _ = query.step();

    return .{
        .layer = 1,
        .x = x,
        .y = y,
    };
}

pub fn generateChest(self: *const Board, guild_id: []const u8, chest_id: []const u8, layer: u8, x: i32, y: i32) void {
    const query = self.insert.generic;
    defer query.reset();

    query.bindText(1, guild_id);
    query.bindText(2, chest_id);
    query.bindInt(3, @intFromEnum(Entity.Chest));
    query.bindInt(4, layer);
    query.bindInt(5, x);
    query.bindInt(6, y);

    _ = query.step();
}

pub fn generateEnemy(self: *const Board, guild_id: []const u8, enemy_id: []const u8, layer: u8, x: i32, y: i32, identifier: u16) void {
    const query = self.insert.generic;
    defer query.reset();

    query.bindText(1, guild_id);
    query.bindText(2, enemy_id);
    query.bindInt(3, @intFromEnum(Entity.Enemy));
    query.bindInt(4, layer);
    query.bindInt(5, x);
    query.bindInt(6, y);
    query.bindInt(7, identifier);

    _ = query.step();
}

pub fn insertLayerPortal(self: *const Board, guild_id: []const u8, layer_id: []const u8, layer: u8, x: i32, y: i32, to: LayerPortalDirection) void {
    const query = self.insert.generic;
    defer query.reset();

    query.bindText(1, guild_id);
    query.bindText(2, layer_id);
    query.bindInt(3, @intFromEnum(Entity.LayerPortal));
    query.bindInt(4, layer);
    query.bindInt(5, x);
    query.bindInt(6, y);
    query.bindInt(7, @intFromEnum(to));

    _ = query.step();
}

pub fn updatePlayerPosition(self: *const Board, guild_id: []const u8, member_id: []const u8, x: i32, y: i32) bool {
    const query = self.update.player.position;
    defer query.reset();

    query.bindInt(1, x);
    query.bindInt(2, y);
    query.bindText(3, guild_id);
    query.bindText(4, member_id);

    _ = query.step();

    if (query.changes() > 0) {
        return true;
    }

    return false;
}

pub fn changePlayerLayer(self: *const Board, guild_id: []const u8, member_id: []const u8, layer: u8) bool {
    const query = self.update.player.layer;
    defer query.reset();

    query.bindInt(1, layer);
    query.bindText(2, guild_id);
    query.bindText(3, member_id);

    _ = query.step();

    if (query.changes() > 0) {
        return true;
    }

    return false;
}

pub fn getPlayerPosition(self: *const Board, guild_id: []const u8, member_id: []const u8) ?PositionalData {
    const query = self.get.player;
    defer query.reset();

    query.bindText(1, guild_id);
    query.bindText(2, member_id);

    const found = query.step();

    if (!found) return null;

    return .{
        .layer = @intCast(query.intColumn(0)),
        .x = @intCast(query.intColumn(1)),
        .y = @intCast(query.intColumn(2)),
    };
}

// TODO: Rework as deleteUsingID or something similar
pub fn deletePlayer(self: *const Board, guild_id: []const u8, member_id: []const u8) void {
    const query = self.delete.player;
    defer query.reset();

    query.bindText(1, guild_id);
    query.bindText(2, member_id);

    _ = query.step();
}

pub fn getPortalPosition(self: *const Board, guild_id: []const u8, layer: u8, direction: LayerPortalDirection) ?PositionalData {
    const query = self.get.portal;
    defer query.reset();

    query.bindText(1, guild_id);
    query.bindInt(2, layer);
    query.bindInt(3, @intFromEnum(direction));

    const found = query.step();

    if (!found) return null;

    return .{
        .layer = @intCast(query.intColumn(0)),
        .x = @intCast(query.intColumn(1)),
        .y = @intCast(query.intColumn(2)),
    };
}

/// The allocator is necessary to hold onto the `id`
/// Its up for the caller to deinit the memory using `Entity.deinit(allocator)` or use an arena allocator
pub fn getEntityInPosition(self: *const Board, allocator: std.mem.Allocator, guild_id: []const u8, layer: u8, x: i32, y: i32) !Entity {
    const query = self.get.entity;
    defer query.reset();

    query.bindText(1, guild_id);
    query.bindInt(2, layer);
    query.bindInt(3, x);
    query.bindInt(4, y);

    const found = query.step();

    if (!found) return .{ .Empty = {} };

    const entity_type: EntityType = @enumFromInt(query.intColumn(0));
    const id = query.textColumn(1);
    const extra = query.intColumn(2);

    const id_len = std.mem.len(id);
    const new_memory = try allocator.alloc(u8, id_len);
    @memcpy(new_memory, id[0..id_len]);

    return switch (entity_type) {
        .Empty => unreachable,
        .Enemy => .{ .Enemy = .{ .id = new_memory, .enemy_id = extra } },
        .LayerPortal => .{ .LayerPortal = .{ .id = new_memory, .to = @enumFromInt(extra) } },
        inline else => |e| {
            return @unionInit(Entity, @tagName(e), .{ .id = new_memory });
        },
    };
}

pub fn deleteEntityInPosition(self: *const Board, guild_id: []const u8, layer: u8, x: i32, y: i32) void {
    const query = self.delete.entity;
    defer query.reset();

    query.bindText(1, guild_id);
    query.bindInt(2, layer);
    query.bindInt(3, x);
    query.bindInt(4, y);

    _ = query.step();
}

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

    pub fn getBoardTile(id: u8) []const u8 {
        return switch (id) {
            0 => "⬛", // Empty
            1 => "🟩", // Player (Self)
            2 => "🟥", // Enemy
            3 => "🟦", // Chest
            4 => "🔳", // Layer Entrance
            99 => "🟪", // Player (Other)
            else => unreachable,
        };
    }
};

pub const LayerPortalDirection = enum(i2) {
    backwards = -1,
    forwards = 1,
};

pub const EntityType = enum {
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
};

/// Caller should use an arena allocator to be able to deinit all entities at once.
pub fn scanForEntities(self: *const Board, allocator: std.mem.Allocator, guild_id: []const u8, center: PositionalData, comptime size: u16) ![]Entity {
    const full_size = size * size;
    var entities: [full_size]Entity = undefined;

    const initial_x = center.x - (size / 2);
    const initial_y = center.y + (size / 2);

    var i: usize = 0;
    var x = initial_x;
    var y = initial_y;
    var entity_count: usize = 0;
    while (i < full_size) : (i += 1) {
        if (i % size == 0) {
            x = initial_x;
            y -= 1;
        }

        const entity = try self.getEntityInPosition(allocator, guild_id, center.layer, x, y);
        if (entity != .Empty) {
            entities[entity_count] = entity;
            entity_count += 1;
        }

        x += 1;
    }

    return entities[0..entity_count];
}
