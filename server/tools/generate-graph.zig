const std = @import("std");
const getXP = @import("player").getNextLevelXP;

pub fn main() !void {
    const file = try std.fs.cwd().createFile("tools/index.html", .{});
    defer file.close();

    try file.writeAll(
        \\<!DOCTYPE html>
        \\<html lang="en">
        \\<head>
        \\<meta charset="UTF-8">
        \\<title>Custom XP Growth Plot</title>
        \\<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        \\</head>
        \\<body>
        \\<div id="plot" style="width: 100%; height: 500px;"></div>
        \\<div id="plot-log" style="width: 100%; height: 500px;"></div>
        \\<script type="module">
        \\const customXp = [
    );

    const writer = file.writer();

    var i: usize = 0;
    while (i <= 3000) : (i += 1) {
        try std.fmt.formatInt(getXP(@intCast(i)), 10, .lower, .{}, writer);
        if (i != 3000) try writer.writeAll(",");
    }

    try file.writeAll(
        \\];
        \\const trace1 = {
        \\    x: Array.from({ length: customXp.length }, (_, i) => i),
        \\    y: customXp,
        \\    mode: 'lines',
        \\    name: 'Custom XP'
        \\};
        \\const trace2 = {
        \\    x: Array.from({ length: customXp.length }, (_, i) => i),
        \\    y: customXp,
        \\    mode: 'lines',
        \\    name: 'Custom XP (Log Scale)'
        \\};
        \\const layout1 = {
        \\    title: 'Custom XP Growth',
        \\    xaxis: { title: 'Level' },
        \\    yaxis: { title: 'XP Required' },
        \\    grid: { rows: 1, columns: 1, pattern: 'independent' }
        \\};
        \\const layout2 = {
        \\    title: 'Custom XP Growth (Log Scale)',
        \\    xaxis: { title: 'Level' },
        \\    yaxis: { title: 'XP Required (Log Scale)', type: 'log' },
        \\    grid: { rows: 1, columns: 1, pattern: 'independent' }
        \\};
        \\Plotly.newPlot('plot', [trace1], layout1);
        \\Plotly.newPlot('plot-log', [trace2], layout2);
        \\</script>
        \\</body>
        \\</html>
    );
}
