const zuws = @import("zuws");

pub const board = zuws.App.Group.initComptime("/board")
    .get("/position/:server_id/:member_id", @import("./view.zig").view)
    .post("/position/:server_id/:member_id/:cache_id/:direction", @import("./move.zig").move)
    .put("/refresh/:server_id/:layer", @import("./refresh.zig").refresh)
    .toConst();
