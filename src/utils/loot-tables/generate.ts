import { ValueType } from "./types.js";
import { join } from "node:path";

import * as Item from "../../schemas/item.js";

import { items, loot_tables } from "../../../config.json";

import type { LootTableContentJSON } from "./types.js";

interface Config {
    items: Record<string, Item.Item>;
    loot_tables: Record<string, Array<LootTableContentJSON>>;
}

async function parse(config: Config): Promise<void> {
    const fileContents: Array<string> = ["import { LootTable } from \"./loot-table.js\";"];

    for (let i = 0, entries = Object.entries(config.items), { length } = entries; i < length; i++) {
        const [id, item] = entries[i];
        Item.addItem(id, item);
    }

    for (let i = 0, entries = Object.entries(config.loot_tables), { length } = entries; i < length; i++) {
        const [id, table] = entries[i];
        const idParts = id.slice(1).split("_");
        const tableName = idParts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");
        const tableContents: Array<string> = [];

        for (let j = 0, l = table.length; j < l; j++) {
            const item = table[j];
            switch (item.type) {
                case ValueType.Table: {
                    const nameParts = item.id.slice(1).split("_");
                    const name = nameParts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");

                    if (name === tableName) throw new Error("A table cannot reference itself in its contents");

                    tableContents.push(`${j > 0 ? "\n" : ""}        {
            type: ${ValueType.Table},
            value: new ${name}(),
            unique: ${item.unique},
            always: ${item.always},
            probability: ${item.probability},
            enabled: ${item.enabled}
        }`);
                    break;
                }
                case ValueType.Item: {
                    tableContents.push(`${j > 0 ? "\n" : ""}        {
            type: ${ValueType.Item},
            value: "${item.id}",
            unique: ${item.unique},
            always: ${item.always},
            probability: ${item.probability},
            enabled: ${item.enabled}
        }`);
                    break;
                }
            }
        }

        fileContents.push(`export class ${tableName} extends LootTable {
    public override contents = [\n${tableContents.join(",")}\n    ];
}`);
    }

    await Bun.write(join(import.meta.dir, "generated-tables.ts"), `${fileContents.join("\n\n")}\n`);
}

await parse({ items, loot_tables });
