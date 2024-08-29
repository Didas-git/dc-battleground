/* eslint-disable @typescript-eslint/naming-convention */
import { getRandomIntInclusive } from "./random-generators.js";
import { ButtonStyle, ComponentType } from "lilybird";
import { findClosest } from "./closest.js";

import * as Board from "../schemas/board.js";
import * as Item from "../schemas/item.js";

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

export function generateRandomChestData(): Board.ChestData {
    const rarity = Board.CHEST_RATIOS_MAP[findClosest(Board.CHEST_RATIOS, Math.random())];
    const possibleRarities = getItemWeightsFromChestRarity(rarity);
    const itemRatios = Object.keys(possibleRarities).map((el) => +el);

    const contents: Board.ChestData["contents"] = [
        {
            type: Board.ChestContentType.Gold,
            amount: getGoldAmountBasedOnRarity(rarity)
        }
    ];

    const extraContent = getExtraContentAmountBasedOnRarity(rarity);

    for (let i = 0, len = extraContent; i < len; i++) {
        const itemRarity = possibleRarities[findClosest(itemRatios, Math.random())];
        const availableItems = Item.getItemsByRarity(itemRarity);
        const item = availableItems[getRandomIntInclusive(0, availableItems.length)];

        if (typeof item === "undefined") continue;

        contents.push({ type: Board.ChestContentType.Item, item });
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

function getItemWeightsFromChestRarity(rarity: Board.ChestRarity): Record<number, Item.ItemRarity> {
    switch (rarity) {
        case Board.ChestRarity.Cursed: {
            return {
                0.1: Item.ItemRarity.Normal,
                0.6: Item.ItemRarity.Advanced,
                0.3: Item.ItemRarity.Epic
            };
        }
        case Board.ChestRarity.Basic: {
            return { 1: Item.ItemRarity.Normal };
        }
        case Board.ChestRarity.Normal: {
            return {
                0.8: Item.ItemRarity.Normal,
                0.2: Item.ItemRarity.Advanced
            };
        }
        case Board.ChestRarity.Epic: {
            return {
                0.1: Item.ItemRarity.Normal,
                0.6: Item.ItemRarity.Advanced,
                0.3: Item.ItemRarity.Epic
            };
        }
        case Board.ChestRarity.Legendary: {
            return {
                0.05: Item.ItemRarity.Normal,
                0.16: Item.ItemRarity.Advanced,
                0.65: Item.ItemRarity.Epic,
                0.14: Item.ItemRarity.Legendary
            };
        }
    }
}
