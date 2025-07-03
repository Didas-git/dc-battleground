const zuws = @import("zuws");

pub const router = zuws.App.Group.initComptime("/v1")
    .group(&@import("./board/endpoints.zig").board)
    .group(&@import("./profile/endpoints.zig").profile)
    .toConst();
