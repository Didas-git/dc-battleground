const std = @import("std");
const sqlite = @import("sqlite");
const Models = @import("models");

var gpa: std.heap.GeneralPurposeAllocator(.{}) = .init;
pub const allocator = gpa.allocator();

// There has to be a better way to do this an im just being blind
pub var db: sqlite.Database = undefined;
pub var Board: Models.Board = undefined;
pub var Player: Models.Player = undefined;
pub var BoardCache: Models.BoardCache = undefined;
pub var BoardLayer: Models.BoardLayer = undefined;
