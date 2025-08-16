const Database = @import("sqlite");
const std = @import("std");

const Statement = Database.Statement;
const pow = std.math.pow;

const Player = @This();

queries: struct {
    create: Statement,
    delete: Statement,
    get: struct {
        all: Statement,
        level: Statement,
        class: Statement,
        servers: Statement,
    },
    update: struct {
        xp: Statement,
    },
},

pub const Profile = struct {
    name: []const u8,
    class: Class,
    xp: XP,

    pub fn deinit(self: *Profile, allocator: std.mem.Allocator) void {
        allocator.free(self.name);
    }
};

pub const Class = enum {
    none,
    mage,
    warrior,

    pub fn jsonStringify(self: Class, jw: anytype) !void {
        return jw.write(@intFromEnum(self));
    }

    pub fn toString(self: Class) []const u8 {
        return switch (self) {
            .none => "#$#",
            .mage => "Mage",
            .warrior => "Warrior",
        };
    }
};

pub const XP = struct {
    level: u16,
    // TODO: XP should probably be `u128`
    // however this requires remaking the entire xp code
    xp: f64,
};

pub fn init(db: *Database) Player {
    const create_table = Statement.init(db,
        \\CREATE TABLE IF NOT EXISTS Player (
        \\id TEXT PRIMARY KEY,
        \\name TEXT NOT NULL,
        \\class INTEGER NOT NULL,
        \\level INTEGER NOT NULL,
        \\xp REAL NOT NULL
        \\)
    );

    defer create_table.deinit();
    _ = create_table.step();

    return .{
        .queries = .{
            .create = .init(db, "INSERT INTO Player (id, name, level, xp, class) VALUES (:id, :name, 0, 0, :class)"),
            .delete = .init(db, "DELETE FROM Player WHERE id = :id"),
            .get = .{
                .all = .init(db, "SELECT name, class, level, xp FROM Player WHERE id = :id"),
                .level = .init(db, "SELECT level, xp FROM Player WHERE id = :id"),
                .class = .init(db, "SELECT class FROM Player WHERE id = :id"),
                .servers = .init(db, "SELECT class FROM Player WHERE id LIKE :id"),
            },
            .update = .{
                .xp = .init(db, "UPDATE Player SET level = :level, xp = :xp WHERE id = :id"),
            },
        },
    };
}

pub fn createProfile(self: *const Player, player_id: []const u8, name: []const u8, class: Class) void {
    const query = self.queries.create;
    defer query.reset();

    query.bindText(1, player_id);
    query.bindText(2, name);
    query.bindInt(3, @intFromEnum(class));

    _ = query.step();
}

pub fn deleteProfile(self: *const Player, player_id: []const u8) void {
    const query = self.queries.delete;
    defer query.reset();

    query.bindText(1, player_id);

    _ = query.step();
}

pub fn getProfile(self: *const Player, allocator: std.mem.Allocator, player_id: []const u8) !?Profile {
    const query = self.queries.get.all;
    defer query.reset();

    query.bindText(1, player_id);

    const found = query.step();
    if (!found) return null;

    return .{
        .name = try query.textColumn(allocator, 0),
        .class = @enumFromInt(query.intColumn(1)),
        .xp = .{
            .level = @intCast(query.intColumn(2)),
            .xp = query.floatColumn(3),
        },
    };
}

// TODO: Check how sqlite handles the return of multiple rows
// pub fn getProfileInAllGuilds(self: *const Player, allocator: std.mem.Allocator, player_id: []const u8) !?[]Profile {
//     const query = self.queries.get.servers;
//     defer query.reset();

//     var buff: [24]u8 = undefined;
//     const len = player_id.len;

//     buff[0] = ':';
//     buff[1] = '%';
//     @memcpy(buff[2 .. len + 2], player_id);

//     query.bindText(1, buff[0 .. len + 2]);

//     const found = query.step();
//     if (!found) return null;
// }

pub fn getClass(self: *const Player, player_id: []const u8) ?Class {
    const query = self.queries.get.class;
    defer query.reset();

    query.bindText(1, player_id);

    const found = query.step();
    if (!found) return null;

    const class_int = query.intColumn(0);
    return @enumFromInt(class_int);
}

pub fn updatePlayerXP(self: *const Player, player_id: []const u8, current_xp: XP, amount: f64) XP {
    const query = self.queries.update.xp;
    defer query.reset();

    const xp_required = getNextLevelXP(current_xp.level);

    const new_xp = current_xp.xp + amount;
    const new_level = current_xp.level;

    if (new_xp >= xp_required) {
        new_level += 1;
        new_xp -= xp_required;
    }

    query.bindInt(1, new_level);
    query.bindFloat(2, new_xp);
    query.bindText(3, player_id);

    _ = query.step();

    return .{
        .level = new_level,
        .xp = new_xp,
    };
}

pub fn getLevel(self: *const Player, player_id: []const u8) ?XP {
    const query = self.queries.get.level;
    defer query.reset();

    query.bindText(1, player_id);

    const found = query.step();
    if (!found) return null;

    const level = query.intColumn(0);
    const xp = query.floatColumn(1);

    return .{
        .level = level,
        .xp = xp,
    };
}

fn linear(l: f64, u: f64, n: f64, x: f64) f64 {
    return l + (u - l) / n * x;
}

fn q(l: f64, u: f64, n: f64, x: f64) f64 {
    return @exp(linear(@log(l), @log(u), n, x));
}
// firetruck
fn t(l: f64, u: f64, n: f64, x: f64) f64 {
    return pow(f64, q(l, u, n, n - 1 - x), 2) / pow(f64, q(l, u, n, n - 1), 2) * l;
}

pub fn getNextLevelXP(level: u16) u64 {
    const x: f64 = @floatFromInt(level);

    const val: f64 = switch (level) {
        0 => 0,
        1...199 => q(500, 50000, 199, x - 1),
        200...299 => q(50000, 200000, 100, x - 200),
        300...399 => t(200000, 150000, 100, x - 300),
        400...498 => t(150000, 100000, 99, x - 400),
        499 => t(100000, 300000, 1, x - 499),
        500...1499 => q(300000, 2500000, 1000, x - 500),
        1500...1699 => 2500000,
        1700...1998 => linear(2500000, 200000000, 299, x - 1700),
        // When put this way, this 2 lines should probably be merged lol
        1999 => 200000000,
        2000 => linear(200000000, 1000000000, 1, x - 2000),
        2001...2149 => 1000000000,
        2150...2899 => q(1000000000, 30000000000, 750, x - 2150),
        2900...2999 => q(30000000000, 1000000000000, 100, x - 2900),
        3000 => 1000000000000,
        else => unreachable,
    };

    return @intFromFloat(@round(val));
}
