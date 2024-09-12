// https://www.codeproject.com/Articles/420046/Loot-Tables-Random-Maps-and-Monsters-Part-I
// https://www.codeproject.com/script/Articles/ViewDownloads.aspx?aid=420845
import { getRandomArbitrary } from "../random-generators.js";

import type { LootTableContent } from "./types.js";

export abstract class LootTable {
    public contents: Array<LootTableContent> = [];

    public getResults(amount: number): Array<LootTableContent> {
        const uniqueDrops = new Set();
        const rv: Array<LootTableContent> = [];
        const droppable: Array<LootTableContent> = [];
        const droppableMap: Array<number> = [];

        let alwaysCount = 0;

        for (let i = 0, { length } = this.contents; i < length; i++) {
            const object = this.contents[i];
            if (!object.enabled) continue;
            if (object.always) {
                rv.push(object);
                alwaysCount++;
                continue;
            }

            droppable.push(object);
            droppableMap.push(object.probability);
        }

        const realDropCount = amount - alwaysCount;
        const probabilitySum = droppable.reduce((a, b) => a + b.probability, 0);

        if (realDropCount > 0) {
            let runningValue = 0;
            for (let i = 0; i < realDropCount; i++) {
                const hitValue = getRandomArbitrary(0, probabilitySum);

                for (let j = 0, { length } = droppable; j < length; j++) {
                    const object = droppable[j];
                    runningValue += object.probability;

                    if (hitValue < runningValue) {
                        if (object.unique && uniqueDrops.has(object)) continue;
                        if (object.unique) uniqueDrops.add(object);

                        rv.push(object);

                        break;
                    }
                }
            }
        }

        return <never>rv;
    }
}
