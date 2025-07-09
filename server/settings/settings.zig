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
    map: struct {
        board: struct {
            empty: []const u8,
            player: []const u8,
            enemy: []const u8,
            chest: []const u8,
            layer: []const u8,
            enemy_player: []const u8,
        },
    },
    floors: [4]struct {
        name: []const u8,
        size: u32,
    },
};
