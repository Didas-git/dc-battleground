const std = @import("std");

const Database = @import("./sqlite/Database.zig");

const _Board = @import("./models/Board.zig");
const _BoardCache = @import("./models/BoardCache.zig");
const _BoardLayer = @import("./models/BoardLayer.zig");

var gpa: std.heap.GeneralPurposeAllocator(.{}) = .init;
pub const allocator = gpa.allocator();

// There has to be a better way to do this an im just being blind
pub var db: Database = undefined;
pub var Board: _Board = undefined;
pub var BoardCache: _BoardCache = undefined;
pub var BoardLayer: _BoardLayer = undefined;
