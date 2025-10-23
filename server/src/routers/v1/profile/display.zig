const globals = @import("globals");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

pub fn display(res: *Response, req: *Request) void {
    const Player = globals.Player;

    const server_id = std.fmt.parseInt(u64, req.getParameter(0), 10) catch {
        res.writeStatus("400 Malformed server_id");
        res.endWithoutBody(true);
        return;
    };

    const member_id = std.fmt.parseInt(u64, req.getParameter(1), 10) catch {
        res.writeStatus("400 Malformed member_id");
        res.endWithoutBody(true);
        return;
    };

    var player = Player.getProfile(globals.allocator, server_id, member_id) catch {
        return utils.handleFailedAllocation(res);
    } orelse {
        res.writeStatusCode(.NotFound);
        res.endWithoutBody(true);
        return;
    };

    defer player.deinit(globals.allocator);

    const stringified_data = std.json.Stringify.valueAlloc(globals.allocator, player, .{}) catch {
        return utils.handleFailedAllocation(res);
    };
    defer globals.allocator.free(stringified_data);

    res.writeStatusCode(.OK);
    res.writeHeader("Content-Type", "application/json; charset=utf8");
    res.end(stringified_data, true);
}
