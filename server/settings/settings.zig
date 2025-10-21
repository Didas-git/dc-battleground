// This is temporary and should be moved to the build script eventually
pub const settings: Settings = @import("./settings.zon");

pub const Refresh = struct {
    chest: f64,
    mob: f64,
};

const Settings = struct {
    board: struct {
        view_size: u16,
        scan_radius: u16,
        entity_map: struct {
            empty: []const u8,
            player: []const u8,
            mob: []const u8,
            chest: []const u8,
            layer: []const u8,
            enemy_player: []const u8,
        },
    },
    refresh: Refresh,
    floors: []const struct {
        name: []const u8,
        size: union(enum) {
            Uniform: u32,
            NonUniform: struct { x: u32, y: u32 },
        },
        refresh: ?Refresh,
    },
};
