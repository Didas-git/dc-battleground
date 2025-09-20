const globals = @import("globals");
const models = @import("models");
const zuws = @import("zuws");
const std = @import("std");

const _Board = models.Board;
const LayerInfo = Layer.Info;
const Request = zuws.Request;
const Response = zuws.Response;
const Layer = models.BoardLayer;
const Coordinates = _Board.Coordinates;

pub fn getCoordinates(gpa: std.mem.Allocator, layer_info: LayerInfo, server_id: []const u8) !Coordinates {
    const Board = globals.Board;

    var coordinates = _Board.generateRandomCoordinates(layer_info.x, layer_info.y);
    var entity = try Board.getEntityInPosition(gpa, server_id, layer_info.layer, coordinates.x, coordinates.y);
    while (entity != .Empty) {
        coordinates = _Board.generateRandomCoordinates(layer_info.x, layer_info.y);
        entity.deinit(gpa);
        entity = try Board.getEntityInPosition(gpa, server_id, layer_info.layer, coordinates.x, coordinates.y);
    }

    entity.deinit(gpa);
    return coordinates;
}

// TODO: Move to global shared file instead
pub fn handleNoLayerInfo(res: *Response) void {
    res.writeStatusCode(.NotFound);
    res.endWithoutBody(true);
}
