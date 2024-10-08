import { getRandomArbitrary } from "../random-generators.js";

import type { LootTableContent } from "./types.js";

export class LootTable {
    public contents: Array<LootTableContent> = [];

    public beforeAlways?: (object: LootTableContent) => void;
    public afterAlways?: (object: LootTableContent) => void;

    public getResults(count: number): Array<LootTableContent> {
        const result: Array<LootTableContent> = [];
        const droppable: Array<LootTableContent> = [];

        let alwaysCount = 0;
        let probabilitySum = 0;

        for (let i = 0, { length } = this.contents; i < length; i++) {
            const object = this.contents[i];
            if (!object.enabled) continue;
            if (object.always) {
                if (typeof this.beforeAlways !== "undefined") this.beforeAlways(object);

                if (object.count > 1) {
                    // If we reduce the amount by one we don't need to add an else for pushing to the array
                    for (let j = 0, amount = object.count - 1; j < amount; j++) {
                        if (object.inclusive) alwaysCount++;
                        result.push(object);
                    }
                }

                if (object.droppable) {
                    droppable.push(object);
                    probabilitySum += object.probability;
                }

                result.push(object);
                alwaysCount++;

                if (typeof this.afterAlways !== "undefined") this.afterAlways(object);
                continue;
            }

            probabilitySum += object.probability;
            droppable.push(object);
        }

        droppable.sort((a, b) => a.probability - b.probability);

        const realDropCount = count - alwaysCount;

        if (realDropCount > 0) {
            for (let i = 0; i < realDropCount; i++) {
                const hitValue = getRandomArbitrary(0, probabilitySum);

                //? Possible optimization? https://en.wikipedia.org/wiki/Divide-and-conquer_algorithm
                for (let j = 0, w = 0, { length } = droppable; j < length; j++) {
                    const object = droppable[j];
                    w += object.probability;
                    if (hitValue > w) continue;
                    if (object.unique) droppable.splice(j, 1);

                    result.push(object);
                    break;
                }
            }
        }

        return <never>result;
    }
}
