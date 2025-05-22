const sqlite = @import("sqlite");
const std = @import("std");

const Database = @import("./Database.zig");

const Statement = @This();

stmt: *sqlite.sqlite3_stmt,
db: *sqlite.sqlite3,

pub fn init(db: *Database, query: [:0]const u8) Statement {
    var stmt: ?*sqlite.sqlite3_stmt = undefined;
    const result = sqlite.sqlite3_prepare_v2(db.db.?, query, @intCast(query.len), &stmt, undefined);

    // TODO: Improve error handling, maybe cast it to a proper enum (?)
    if (result != sqlite.SQLITE_OK) {}
    return .{
        .stmt = stmt.?,
        .db = db.db.?,
    };
}

pub fn step(self: *const Statement) bool {
    const result = sqlite.sqlite3_step(self.stmt);
    if (result == sqlite.SQLITE_ROW) return true;
    // TODO: Improve error handling
    if (result != sqlite.SQLITE_DONE) {}
    return false;
}

pub fn clear(self: *const Statement) void {
    const result = sqlite.sqlite3_clear_bindings(self.stmt);
    // TODO: Improve error handling
    if (result != sqlite.SQLITE_OK) {}
}

pub fn reset(self: *const Statement) void {
    const result = sqlite.sqlite3_reset(self.stmt);
    // TODO: Improve error handling
    if (result != sqlite.SQLITE_OK) {}
}

pub fn clearAndReset(self: *const Statement) void {
    self.clear();
    self.reset();
}

pub fn deinit(self: *const Statement) void {
    const result = sqlite.sqlite3_finalize(self.stmt);
    // TODO: Improve error handling
    if (result != sqlite.SQLITE_OK) {}
}

pub fn bindNull(self: *const Statement, index: u8) void {
    const result = sqlite.sqlite3_bind_null(self.stmt, @as(c_int, index));

    // TODO: Improve error handling
    if (result != sqlite.SQLITE_OK) {}
}

pub fn bindText(self: *const Statement, index: u8, text: []const u8) void {
    // TODO: Check if transient really is the best option for us
    const result = sqlite.sqlite3_bind_text(self.stmt, @as(c_int, index), text.ptr, @as(c_int, @intCast(text.len)), sqlite.SQLITE_TRANSIENT);

    // TODO: Improve error handling
    if (result != sqlite.SQLITE_OK) {}
}

pub fn bindNumber(self: *const Statement, T: type, index: u8, number: T) void {
    switch (@typeInfo(T)) {
        // TODO: Integers and floats bigger than 64bits should be bound as blob
        .int, .comptime_int => self.bindInt(index, @as(i64, number)),
        .float, .comptime_float => self.bindFloat(index, @as(f64, number)),
        else => @compileError("Invalid type"),
    }
}

pub fn bindInt(self: *const Statement, index: u8, int: i64) void {
    const result = sqlite.sqlite3_bind_int64(self.stmt, @as(c_int, index), int);

    // TODO: Improve error handling
    if (result != sqlite.SQLITE_OK) {}
}

pub fn bindFloat(self: *const Statement, index: u8, float: f64) void {
    const result = sqlite.sqlite3_bind_double(self.stmt, @as(c_int, index), float);

    // TODO: Improve error handling
    if (result != sqlite.SQLITE_OK) {}
}

pub fn textColumn(self: *const Statement, column: u8) [*c]const u8 {
    return sqlite.sqlite3_column_text(self.stmt, @as(c_int, column));
}

pub fn intColumn(self: *const Statement, column: u8) i64 {
    return sqlite.sqlite3_column_int64(self.stmt, @as(c_int, column));
}

pub fn floatColumn(self: *const Statement, column: u8) f64 {
    return sqlite.sqlite3_column_double(self.stmt, @as(c_int, column));
}

pub fn columnCount(self: *const Statement) i32 {
    return sqlite.sqlite3_column_count(self.stmt);
}

pub fn dataCount(self: *const Statement) i32 {
    return sqlite.sqlite3_data_count(self.stmt);
}

pub fn changes(self: *const Statement) i64 {
    return sqlite.sqlite3_changes64(self.db);
}
