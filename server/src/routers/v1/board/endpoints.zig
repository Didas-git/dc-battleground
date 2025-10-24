const zuws = @import("zuws");

pub const board = zuws.App.Group.initComptime("/board")
    .get("/position/:server_id/:member_id/:message_id", @import("./view.zig").view)
    .post("/position/:server_id/:member_id/:message_id/:direction", @import("./move.zig").move)
    .get("/scan-from/:server_id/:member_id", @import("./scan.zig").scan)
    .put("/refresh/:server_id/:layer", @import("./refresh.zig").refresh)
    .put("/spawn/:server_id/:layer/:type", @import("./spawn.zig").spawn)
    .toConst();
