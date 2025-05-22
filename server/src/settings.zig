// This is temporary and should be moved to the build script eventually
pub const settings: Settings = @import("./settings.zon");

const Settings = struct {
    board: struct {
        view_size: u16,
        scan_size: u16,
    },
    refresh: struct {
        chest: f64,
        mob: f64,
    },
    floors: [4]struct {
        name: []const u8,
        size: u32,
    },
};
