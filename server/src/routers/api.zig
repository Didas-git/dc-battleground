const zuws = @import("zuws");

pub const api = zuws.App.Group.initComptime("/api")
    .group(&@import("./v1/router.zig").router)
    .toConst();
