const zuws = @import("zuws");

pub const profile = zuws.App.Group.initComptime("/profile")
    .put("/create/:server_id/:member_id/:name/:class", @import("./create.zig").create)
    .toConst();
