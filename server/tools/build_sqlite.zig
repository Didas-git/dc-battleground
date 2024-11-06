const std = @import("std");

pub fn main() !void {
    const cwd = std.fs.cwd();

    const tools_path = try cwd.realpathAlloc(std.heap.page_allocator, "tools");
    var tools_dir = try std.fs.openDirAbsolute(tools_path, .{});
    defer tools_dir.close();

    const temp_dir_path = try std.mem.concat(std.heap.page_allocator, u8, &.{ tools_path, "/temp" });
    try tools_dir.makeDir("temp");
    defer tools_dir.deleteTree("temp") catch unreachable;

    cwd.makeDir("sqlite") catch |err| switch (err) {
        error.PathAlreadyExists => undefined,
        else => return err,
    };

    const sqlite_destination_path = try cwd.realpathAlloc(std.heap.page_allocator, "sqlite");
    const sqlite_source_path = try cwd.realpathAlloc(std.heap.page_allocator, "../sqlite");

    _ = try std.process.Child.run(.{
        .allocator = std.heap.page_allocator,
        .argv = &.{
            try std.mem.concat(std.heap.page_allocator, u8, &.{ sqlite_source_path, "/configure" }),
        },
        .cwd = temp_dir_path,
    });

    // This doesnt work, i need to find a way to execute make within a child process
    var child = std.ChildProcess.init(&.{"make sqlite3.c"}, std.heap.page_allocator);
    child.stdin_behavior = .Ignore;
    child.stdout_behavior = .Inherit;
    child.stderr_behavior = .Inherit;
    child.cwd = temp_dir_path;
    child.uid = std.os.linux.geteuid();

    _ = try child.spawnAndWait();

    const source_sqlite_header_file = try std.mem.concat(std.heap.page_allocator, u8, &.{ temp_dir_path, "/sqlite3.h" });
    const source_sqlite_c_file = try std.mem.concat(std.heap.page_allocator, u8, &.{ sqlite_destination_path, "/sqlite3.c" });
    const final_sqlite_header_file = try std.mem.concat(std.heap.page_allocator, u8, &.{ temp_dir_path, "/sqlite3.h" });
    const final_sqlite_c_file = try std.mem.concat(std.heap.page_allocator, u8, &.{ sqlite_destination_path, "/sqlite3.c" });

    try std.fs.copyFileAbsolute(source_sqlite_header_file, final_sqlite_header_file, .{});
    try std.fs.copyFileAbsolute(source_sqlite_c_file, final_sqlite_c_file, .{});
}
