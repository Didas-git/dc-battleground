const zuws = @import("zuws");
const std = @import("std");

pub fn main() !void {
    const app: zuws.App = try .init();
    defer app.deinit();

    app.get("/*", struct {
        fn f(res: *zuws.Response, req: *zuws.Request) void {
            _ = req;
            var gpa: std.heap.GeneralPurposeAllocator(.{}) = .init;
            const allocator = gpa.allocator();

            const file = std.fs.cwd().openFile("tools/index.html", .{ .mode = .read_only }) catch unreachable;
            defer file.close();

            const contents = file.readToEndAlloc(allocator, std.math.maxInt(usize)) catch unreachable;
            res.end(contents, true);
        }
    }.f).listen(8000, null);

    app.run();
}
