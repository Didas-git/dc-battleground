const std = @import("std");

const Models = @import("models");

var gpa: std.heap.GeneralPurposeAllocator(.{}) = .init;
pub const allocator = gpa.allocator();

// There has to be a better way to do this an im just being blind
// pub var db: Database = undefined;
pub var Board: Models.Board = undefined;
pub var Player: Models.Player = undefined;
pub var BoardCache: Models.BoardCache = undefined;
pub var BoardLayer: Models.BoardLayer = undefined;
