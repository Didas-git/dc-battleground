const zuws = @import("zuws");

pub const board = zuws.App.Group.initComptime("/board")
    .get("/position/:guild_id/:member_id", @import("./view.zig").view)
    .post("/position/:guild_id/:member_id/:cache_id/:direction", @import("./move.zig").move)
    .toConst();
