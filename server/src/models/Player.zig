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

fn q(_l: u64, _u: u64, n: u64, x: u64) u64 {
    const l: f64 = @floatFromInt(_l);
    const u: f64 = @floatFromInt(_u);

    return @intFromFloat(@round(@exp(linear(@log(l), @log(u), @floatFromInt(n), @floatFromInt(x)))));
}
// firetruck
fn t(l: u64, u: u64, n: u64, x: u64) u64 {
    return (pow(u64, q(l, u, n, n - 1 - x), 2)) / (pow(u64, q(l, u, n, n - 1), 2)) * l;
}

pub fn getNextLevelXP(x: u16) u64 {
    if (x == 0) {
        return 0;
    }
    if (1 <= x and x < 200) {
        return q(500, 50000, 199, x - 1);
    }
    if (200 <= x and x < 300) {
        return q(50000, 200000, 100, x - 200);
    }
    if (300 <= x and x < 400) {
        return t(200000, 150000, 100, x - 300);
    }
    if (400 <= x and x < 499) {
        return t(150000, 100000, 99, x - 400);
    }
    if (499 <= x and x < 500) {
        return t(100000, 300000, 1, x - 499);
    }
    if (500 <= x and x < 1500) {
        return q(300000, 2500000, 1000, x - 500);
    }
    if (1500 <= x and x < 1700) {
        return 2500000;
    }
    if (1700 <= x and x < 1999) {
        return @intFromFloat(@round(linear(2500000, 200000000, 299, @floatFromInt(x - 1700))));
    }
    if (1999 <= x and x < 2000) {
        return 200000000;
    }
    if (2000 <= x and x < 2001) {
        return @intFromFloat(@round(linear(200000000, 1000000000, 1, @floatFromInt(x - 2000))));
    }
    if (2001 <= x and x < 2150) {
        return 1000000000;
    }
    if (2150 <= x and x < 2900) {
        return q(1000000000, 30000000000, 750, x - 2150);
    }
    if (2900 <= x and x < 3000) {
        return q(30000000000, 1000000000000, 100, x - 2900);
    }

    // x == 3000
    return 1000000000000;
}
