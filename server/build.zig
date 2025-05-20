const std = @import("std");

pub fn build(b: *std.Build) void {
    const cwd = std.fs.cwd();
    const exists = if (cwd.access("sqlite/sqlite3.h", .{})) |_| true else |_| false;

    if (!exists) {
        const tool = b.addExecutable(.{
            .name = "build_sqlite",
            .root_source_file = b.path("tools/build_sqlite.zig"),
            .target = b.graph.host,
        });

        const tool_step = b.addRunArtifact(tool);
        b.getInstallStep().dependOn(&tool_step.step);
    }

    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const exe = b.addExecutable(.{
        .name = "server",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    const zuws = b.dependency("zuws", .{
        .target = target,
        .optimize = optimize,
    });

    const sqlite = b.addLibrary(.{
        .name = "sqlite",
        .root_module = b.addTranslateC(.{
            .root_source_file = b.path("sqlite/sqlite3.h"),
            .target = target,
            .optimize = optimize,
            .link_libc = true,
        }).createModule(),
    });

    sqlite.addCSourceFile(.{ .file = b.path("sqlite/sqlite3.c") });

    exe.root_module.addImport("sqlite", sqlite.root_module);
    exe.root_module.addImport("zuws", zuws.module("zuws"));
    b.installArtifact(exe);

    const run_exe = b.addRunArtifact(exe);

    const run_step = b.step("run", "Run the application");
    run_step.dependOn(&run_exe.step);
}
