import * as Battleground from "#bt";

// https://www.compart.com/en/unicode/block/U+1F800
export const DIRECTION_UNICODE_MAP: Record<string, string> = {
    left: "\u{1F844}", // 🡄
    up: "\u{1F845}", // 🡅
    down: "\u{1F847}", // 🡇
    right: "\u{1F846}" // 🡆
};

export const DIRECTION_MAP: Record<string, Battleground.Direction> = {
    left: Battleground.Direction.Left,
    up: Battleground.Direction.Up,
    down: Battleground.Direction.Down,
    right: Battleground.Direction.Right
};

export function calculateCoordinates(x: number, y: number, direction: string): { x: number, y: number } {
    switch (direction) {
        case "left": {
            return { x: x - 1, y };
        }
        case "up": {
            return { x, y: y + 1 };
        }
        case "down": {
            return { x, y: y - 1 };
        }
        case "right": {
            return { x: x + 1, y };
        }
        default: return { x, y };
    }
}

