const std = @import("std");

const Database = @import("../sqlite/Database.zig");
const Statement = Database.Statement;
const pow = std.math.pow;

const Player = @This();

pub const Class = enum {
    none,
    mage,
    warrior,

    pub fn toString(self: *Class) [:0]const u8 {
        return switch (self) {
            .none => "#$#",
            .mage => "Mage",
            .warrior => "Warrior",
        };
    }
};

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

pub fn getNextLevelXP(_x: u16) u64 {
    const x: f64 = @floatFromInt(_x);

    const val: f64 = switch (_x) {
        0 => 0,
        1...199 => q(500, 50000, 199, x - 1),
        200...299 => q(50000, 200000, 100, x - 200),
        300...399 => t(200000, 150000, 100, x - 300),
        400...498 => t(150000, 100000, 99, x - 400),
        499 => t(100000, 300000, 1, x - 499),
        500...1499 => q(300000, 2500000, 1000, x - 500),
        1500...1699 => 2500000,
        1700...1998 => linear(2500000, 200000000, 299, x - 1700),
        // When put this way this 2 lines should probably be merged lol
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
