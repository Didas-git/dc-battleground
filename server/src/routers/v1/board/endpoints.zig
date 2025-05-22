const zuws = @import("zuws");

pub const board = zuws.App.Group.initComptime("/board")
    .get("/move/:member_id/:cache_id/:direction", @import("./move.zig").move)
    .toConst();
