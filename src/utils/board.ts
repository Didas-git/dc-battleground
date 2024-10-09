import { ButtonStyle, ComponentType } from "lilybird";

import * as BoardLayer from "../schemas/board-layer.js";
import * as Board from "../schemas/board.js";

import type { Embed, Message } from "lilybird";

// https://www.compart.com/en/unicode/block/U+1F800
export const DIRECTION_MAP: Record<string, string> = {
    left: "\u{1F844}", // 🡄
    up: "\u{1F845}", // 🡅
    down: "\u{1F847}", // 🡇
    right: "\u{1F846}" // 🡆
};

export const MOVEMENT_ROW: Message.Component.ActionRowStructure = {
    type: ComponentType.ActionRow,
    components: [
        {
            type: ComponentType.Button,
            custom_id: "arrow-left",
            style: ButtonStyle.Primary,
            label: DIRECTION_MAP.left
        },
        {
            type: ComponentType.Button,
            custom_id: "arrow-up",
            style: ButtonStyle.Primary,
            label: DIRECTION_MAP.up
        },
        {
            type: ComponentType.Button,
            custom_id: "arrow-down",
            style: ButtonStyle.Primary,
            label: DIRECTION_MAP.down
        },
        {
            type: ComponentType.Button,
            custom_id: "arrow-right",
            style: ButtonStyle.Primary,
            label: DIRECTION_MAP.right
        }
    ]
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

export async function makeBoardEmbed(position: Board.BoardData, memberId: string, moveDirection?: string): Promise<Embed.Structure> {
    const board = await Board.scanFromCenter(position, Board.BOARD_VIEW_SIZE, memberId, typeof moveDirection !== "undefined");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { name } = BoardLayer.getBoardLayerInfo(position.layer)!;

    let str = "";
    for (let i = 0, { length } = board; i < length; i++) {
        if (i % Board.BOARD_VIEW_SIZE === 0 && i !== 0) str += "\n";
        str += Board.BOARD_MAPPINGS[board[i]];
    }

    return {
        title: "Board",
        color: 0x0000ff,
        description: str,
        footer: { text: `[${position.layer}]${name}: X: ${position.x} | Y: ${position.y} ${moveDirection ?? ""}` }
    };
}

