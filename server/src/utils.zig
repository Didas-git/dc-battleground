const zuws = @import("zuws");

const Response = zuws.Response;

pub fn handleFailedAllocation(res: *Response) void {
    res.writeStatus("500 Allocator shit the bed");
    res.endWithoutBody(true);
}
