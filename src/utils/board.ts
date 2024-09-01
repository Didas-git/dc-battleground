
import { getRandomIntInclusive } from "./random-generators.js";
import { mapChestRarityToLootTable } from "../items/chests.js";
import { ButtonStyle, ComponentType } from "lilybird";
import { findClosest } from "./closest.js";

import * as Board from "../schemas/board.js";

import type { Embed, Message } from "lilybird";

// https://www.compart.com/en/unicode/block/U+1F800
export const DIRECTION_MAP: Record<string, string> = {
    left: "\u{1F844}", // 🡄
    up: "\u{1F845}", // 🡅
    down: "\u{1F847}", // 🡇
    right: "\u{1F846}" // 🡆
};

export function makeMovementRow(x: number, y: number): Message.Component.ActionRowStructure {
    return {
        type: ComponentType.ActionRow,
        components: [
            {
                type: ComponentType.Button,
                custom_id: `arrow-left:${x - 1},${y}`,
                style: ButtonStyle.Primary,
                label: DIRECTION_MAP.left
            },
            {
                type: ComponentType.Button,
                custom_id: `arrow-up:${x},${y + 1}`,
                style: ButtonStyle.Primary,
                label: DIRECTION_MAP.up
            },
            {
                type: ComponentType.Button,
                custom_id: `arrow-down:${x},${y - 1}`,
                style: ButtonStyle.Primary,
                label: DIRECTION_MAP.down
            },
            {
                type: ComponentType.Button,
                custom_id: `arrow-right:${x + 1},${y}`,
                style: ButtonStyle.Primary,
                label: DIRECTION_MAP.right
            }
        ]
    };
}

export async function makeBoardEmbed(position: Board.BoardData, memberId: string, moveDirection?: string): Promise<Embed.Structure> {
    const board = await Board.scanFromCenter(position, Board.BOARD_VIEW_SIZE, memberId, typeof moveDirection !== "undefined");

    let str = "";
    for (let i = 0, { length } = board; i < length; i++) {
        if (i % Board.BOARD_VIEW_SIZE === 0 && i !== 0) str += "\n";
        str += Board.BOARD_MAPPINGS[board[i]];
    }

    return {
        title: "Board",
        color: 0x0000ff,
        description: str,
        footer: { text: `X: ${position.x} | Y: ${position.y} ${moveDirection ?? ""}` }
    };
}

export function generateRandomChestData(): Board.ChestData {
    const rarity = Board.CHEST_RATIOS_MAP[findClosest(Board.CHEST_RATIOS, Math.random())];

    const contents: Board.ChestData["contents"] = [
        {
            type: Board.ChestContentType.Gold,
            amount: getGoldAmountBasedOnRarity(rarity)
        }
    ];

    const extraContent = getExtraContentAmountBasedOnRarity(rarity);
    const mainTable = mapChestRarityToLootTable(rarity);
    const lootTables = mainTable.resultsBetween(extraContent, extraContent);

    for (let i = 0, { length } = lootTables; i < length; i++) {
        const loot = lootTables[i].rdsResults();

        if (loot.length > 1) throw new Error("Unreachable");

        contents.push({ type: Board.ChestContentType.Item, item: loot[0].rdsValue.id });
    }

    return { rarity, contents };
}

function getGoldAmountBasedOnRarity(rarity: Board.ChestRarity): number {
    switch (rarity) {
        case Board.ChestRarity.Cursed: { return 0; }
        case Board.ChestRarity.Basic: { return getRandomIntInclusive(0, 30); }
        case Board.ChestRarity.Normal: { return getRandomIntInclusive(25, 50); }
        case Board.ChestRarity.Epic: { return getRandomIntInclusive(100, 500); }
        case Board.ChestRarity.Legendary: { return getRandomIntInclusive(1000, 3000); }
    }
}

function getExtraContentAmountBasedOnRarity(rarity: Board.ChestRarity): number {
    switch (rarity) {
        case Board.ChestRarity.Cursed: { return 0; }
        case Board.ChestRarity.Basic: { return getRandomIntInclusive(0, 2); }
        case Board.ChestRarity.Normal: { return getRandomIntInclusive(1, 4); }
        case Board.ChestRarity.Epic: { return getRandomIntInclusive(3, 6); }
        case Board.ChestRarity.Legendary: { return getRandomIntInclusive(5, 10); }
    }
}
