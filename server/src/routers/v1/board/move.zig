const zuws = @import("zuws");
const std = @import("std");

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

pub fn move(res: *Response, req: *Request) void {
    const member_id = req.getParameter(0);
    const cache_id = req.getParameter(1);

    std.debug.print("MOVE: {s} | {s}\n", .{ member_id, cache_id });
    res.endWithoutBody(true);
}
