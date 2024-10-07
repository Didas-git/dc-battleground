import { BasicChestTable, EpicChestTable, LegendaryChestTable, NormalChestTable } from "./loot-tables/generated-tables.js";
import { getRandomIntInclusive } from "./random-generators.js";
import { LootTableValueType } from "./loot-tables/types.js";
import { ButtonStyle, ComponentType } from "lilybird";
import { findClosest } from "./closest.js";

import * as BoardLayer from "../schemas/board-layer.js";
import * as Board from "../schemas/board.js";

import type { Embed, Message } from "lilybird";
import type { LootTable } from "./loot-tables/loot-table.js";
import type { LootTableContent } from "./loot-tables/types.js";

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

export function generateRandomChestData(): Board.ChestData {
    const rarity = Board.CHEST_RATIOS_MAP[findClosest(Board.CHEST_RATIOS, Math.random())];

    const contents: Board.ChestData["contents"] = [
        {
            type: Board.ChestContentType.Coins,
            amount: getCoinAmountBasedOnRarity(rarity)
        }
    ];

    const extraContent = getExtraContentAmountBasedOnRarity(rarity);
    const mainTable = mapChestRarityToLootTable(rarity);
    const lootTables = mainTable.getResults(extraContent);

    for (let i = 0, { length } = lootTables; i < length; i++) {
        const lootTable = lootTables[i];

        contents.push({ type: Board.ChestContentType.Item, item: iterateUntilValue(lootTable) });
    }

    return { rarity, contents };
}

//! TODO: Nested tables should be handled by the loot table class itself
function iterateUntilValue(loot: LootTableContent): string {
    switch (loot.type) {
        case LootTableValueType.Table: { return iterateUntilValue(loot.value.getResults(1)[0]); }
        case LootTableValueType.Item: { return loot.value; }
        case LootTableValueType.Enemy: { throw new Error("Unreachable!"); }
    }
}

function getCoinAmountBasedOnRarity(rarity: Board.ChestRarity): number {
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

export function mapChestRarityToLootTable(rarity: Board.ChestRarity): LootTable {
    switch (rarity) {
        // TODO: Make cursed loot table for cursed drops and chests
        case Board.ChestRarity.Cursed: { return new BasicChestTable(); }
        case Board.ChestRarity.Basic: { return new BasicChestTable(); }
        case Board.ChestRarity.Normal: { return new NormalChestTable(); }
        case Board.ChestRarity.Epic: { return new EpicChestTable(); }
        case Board.ChestRarity.Legendary: { return new LegendaryChestTable(); }
    }
}
