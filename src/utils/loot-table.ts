// https://www.codeproject.com/Articles/420046/Loot-Tables-Random-Maps-and-Monsters-Part-I
// https://www.codeproject.com/script/Articles/ViewDownloads.aspx?aid=420845
import { getRandomArbitrary, getRandomIntInclusive } from "./random-generators.js";

export interface LootTableObject {
    /**
     * The chance for this item to drop
     */
    rdsProbability: number;
    /**
     * Only drops once per query
     */
    rdsUnique: boolean;
    /**
     * Drops always
     */
    rdsAlways: boolean;
    /**
     * Can it drop now?
     */
    rdsEnabled: boolean;
}

export interface LootTableValue<T> extends LootTableObject {
    rdsValue: T;
}

export interface LootTableNullValue extends LootTableValue<null> {}

export abstract class LootTable implements LootTableObject {
    public abstract onRDSPreResultEvaluation: ((object: LootTableObject) => unknown) | undefined;

    public abstract onRDSHit: ((object: LootTableObject) => unknown) | undefined;

    public abstract onRDSPostResultEvaluation: ((object: LootTableObject) => unknown) | undefined;

    public abstract rdsProbability: number;
    public abstract rdsUnique: boolean;
    public abstract rdsAlways: boolean;
    public abstract rdsEnabled: boolean;
    public abstract rdsCount: number;
    public rdsContents: Array<LootTableObject> = [];

    public add(entry: LootTableObject, probability?: number): void {
        if (probability) entry.rdsProbability = probability;
        this.rdsContents.push(entry);
    }

    public resultsBetween(min: number, max: number): Array<LootTableObject> {
        const currentCount = this.rdsCount;
        this.rdsCount = getRandomIntInclusive(min, max);
        const results = this.rdsResults;
        this.rdsCount = currentCount;
        return results;
    }

    public get rdsResults(): Array<LootTableObject> {
        const uniqueDrops = new Set();
        const rv: Array<LootTableObject> = [];
        const droppable: Array<LootTableObject> = [];
        const droppableMap: Array<number> = [];

        let alwaysCount = 0;

        if (typeof this.onRDSPreResultEvaluation !== "undefined")
            for (let i = 0, { length } = this.rdsContents; i < length; i++) this.onRDSPreResultEvaluation(this.rdsContents[i]);

        for (let i = 0, { length } = this.rdsContents; i < length; i++) {
            const object = this.rdsContents[i];
            if (!object.rdsEnabled) continue;
            if (object.rdsAlways) {
                rv.push(object);
                alwaysCount++;
                continue;
            }

            droppable.push(object);
            droppableMap.push(object.rdsProbability);
        }

        const realDropCount = this.rdsCount - alwaysCount;
        const probabilitySum = droppable.reduce((a, b) => a + b.rdsProbability, 0);

        if (realDropCount > 0) {
            let runningValue = 0;
            for (let i = 0; i < realDropCount; i++) {
                const hitValue = getRandomArbitrary(0, probabilitySum);

                for (let j = 0, { length } = droppable; j < length; j++) {
                    const object = droppable[j];
                    runningValue += object.rdsProbability;

                    if (hitValue < runningValue) {
                        if (object.rdsUnique && uniqueDrops.has(object)) continue;
                        if (object.rdsUnique) uniqueDrops.add(object);

                        if ("rdsContents" in object) rv.push(...(<LootTable>object).rdsContents);
                        else {
                            rv.push(object);
                            this.onRDSHit?.(object);
                        }

                        break;
                    }
                }
            }
        }

        if (typeof this.onRDSPostResultEvaluation !== "undefined")
            for (let i = 0, { length } = rv; i < length; i++) this.onRDSPostResultEvaluation(rv[i]);

        return rv;
    }
}
