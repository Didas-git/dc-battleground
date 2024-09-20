// https://www.codeproject.com/Articles/420046/Loot-Tables-Random-Maps-and-Monsters-Part-I
// https://www.codeproject.com/script/Articles/ViewDownloads.aspx?aid=420845
import { getRandomArbitrary } from "../random-generators.js";

import type { LootTableContent } from "./types.js";

export abstract class LootTable {
    public contents: Array<LootTableContent> = [];

    #findClosest(arr: Array<LootTableContent>, target: number): LootTableContent {
        let left = 0;
        let right = arr.length - 1;

        while (left < right) {
            let pl = arr[left].probability;
            let pr = arr[right].probability;

            // If the probabilities are equal we want to randomly reduce one of them by a small value
            if (pl === pr) {
                const shouldReduceLeft = Math.round(Math.random()) === 1;
                if (shouldReduceLeft) pl -= 0.0000000001;
                else pr -= 0.0000000001;
            }

            if (Math.abs(pl - target) <= Math.abs(pr - target)) right--;
            else left++;
        }

        return arr[left];
    }

    public getResults(amount: number): Array<LootTableContent> {
        const uniqueDrops = new Set();
        const result: Array<LootTableContent> = [];
        const droppable: Array<LootTableContent> = [];

        let alwaysCount = 0;

        for (let i = 0, { length } = this.contents; i < length; i++) {
            const object = this.contents[i];
            if (!object.enabled) continue;
            if (object.always) {
                if (object.allowExtra) droppable.push(object);
                result.push(object);
                alwaysCount++;
                continue;
            }

            droppable.push(object);
        }

        // This not only makes it easier to get the highest probability
        // but it also helps to fix some odd behavior that you would
        // otherwise encounter with the find closest function
        droppable.sort((a, b) => a.probability - b.probability);

        const realDropCount = amount - alwaysCount;
        const biggestProbability = droppable.at(-1)?.probability ?? 1;

        if (realDropCount > 0) {
            for (let i = 0; i < realDropCount; i++) {
                //! TODO Remake the way to get the hit value
                // When being fully random we get a really standard distribution
                // This pretty much means that probabilities are not properly respected
                // when there are few items in the table
                // ex: with an item of probability 50 and one with probability 1 you would expect to see 50 for each 1
                // however with this random system we still get a 50/50 distribution (which is expected)
                //
                // The hit value should be somewhat aware of the way probabilities should be distributed
                const hitValue = getRandomArbitrary(0, biggestProbability + 1);
                const object = this.#findClosest(droppable, hitValue);

                if (object.unique) {
                    if (uniqueDrops.has(object)) {
                        // Even tho the item is already in the drops
                        // we still want to get the specified amount of items
                        i--;
                        continue;
                    }

                    uniqueDrops.add(object);
                }

                result.push(object);
            }
        }

        return <never>result;
    }
}
