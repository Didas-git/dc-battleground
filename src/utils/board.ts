import { ButtonStyle, ComponentType } from "lilybird";

import * as Board from "../schemas/board.js";

import type { Embed, Message } from "lilybird";

export const DIRECTION_MAP: Record<string, string> = {
    left: "⬅️",
    up: "⬆️",
    down: "⬇️",
    right: "➡️"
};

export function makeMovementRow(x: number, y: number): Message.Component.ActionRowStructure {
    return {
        type: ComponentType.ActionRow,
        components: [
            {
                type: ComponentType.Button,
                custom_id: `arrow-left:${x - 1},${y}`,
                style: ButtonStyle.Primary,
                label: "⬅️"
            },
            {
                type: ComponentType.Button,
                custom_id: `arrow-up:${x},${y + 1}`,
                style: ButtonStyle.Primary,
                label: "⬆️"
            },
            {
                type: ComponentType.Button,
                custom_id: `arrow-down:${x},${y - 1}`,
                style: ButtonStyle.Primary,
                label: "⬇️"
            },
            {
                type: ComponentType.Button,
                custom_id: `arrow-right:${x + 1},${y}`,
                style: ButtonStyle.Primary,
                label: "➡️"
            }
        ]
    };
}

export function makeBoardEmbed(position: Board.BoardData, memberId: string, append: string = ""): Embed.Structure {
    const board = Board.scanFromCenter(position, Board.BOARD_VIEW_SIZE, memberId);

    let str = "";
    for (let i = 0, { length } = board; i < length; i++) {
        if (i % Board.BOARD_VIEW_SIZE === 0 && i !== 0) str += "\n";
        str += Board.BOARD_MAPPINGS[board[i]];
    }

    return {
        title: "Board",
        color: 0x0000ff,
        description: str,
        footer: { text: `X: ${position.x} | Y: ${position.y} ${append}` }
    };
}
