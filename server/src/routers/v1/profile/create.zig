const globals = @import("globals");
const utils = @import("utils");
const zuws = @import("zuws");
const std = @import("std");

const Class = @import("models").Player.Class;

const App = zuws.App;
const Request = zuws.Request;
const Response = zuws.Response;

//TODO: Handle already existing profiles
pub fn create(res: *Response, req: *Request) void {
    const Player = globals.Player;
    const Board = globals.Board;

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

    const name = req.getParameter(2);
    const class_string = req.getParameter(3);
    const class = std.meta.intToEnum(Class, std.fmt.parseInt(u8, class_string, 10) catch {
        res.writeStatus("400 Malformed class");
        res.endWithoutBody(true);
        return;
    }) catch {
        res.writeStatus("400 Invalid class");
        res.endWithoutBody(true);
        return;
    };

    // TODO: creating profile fails when the tile has something
    Player.createProfile(server_id, member_id, name, class) catch {
        res.writeStatusCode(.InternalServerError);
        res.endWithoutBody(true);
        return;
    };

    const origin = Board.spawnPlayer(globals.allocator, server_id, member_id) catch {
        return utils.handleFailedAllocation(res);
    };

    var buff: [24]u8 = undefined;
    const str = std.fmt.bufPrint(&buff, "{d},{d}", .{ origin.x, origin.y }) catch {
        return utils.handleFailedAllocation(res);
    };

    res.writeStatusCode(.OK);
    res.end(str, true);
}
