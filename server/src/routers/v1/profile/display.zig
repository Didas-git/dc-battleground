const globals = @import("globals");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

pub fn display(res: *Response, req: *Request) void {
    const Player = globals.Player;

    const server_id = req.getParameter(0);
    const member_id = req.getParameter(1);

    const player_id = std.fmt.allocPrint(globals.allocator, "{s}:{s}", .{ server_id, member_id }) catch {
        return utils.handleFailedAllocation(res);
    };
    defer globals.allocator.free(player_id);

    var player = Player.getProfile(globals.allocator, player_id) catch {
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
