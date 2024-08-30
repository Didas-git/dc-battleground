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

export abstract class LootTable<I extends LootTableObject = LootTableObject> implements LootTableObject {
    public abstract onRDSPreResultEvaluation: ((object: LootTableObject) => unknown) | undefined;

    public abstract onRDSHit: ((object: LootTableObject) => unknown) | undefined;

    public abstract onRDSPostResultEvaluation: ((object: LootTableObject) => unknown) | undefined;

    public abstract rdsProbability: number;
    public abstract rdsUnique: boolean;
    public abstract rdsAlways: boolean;
    public abstract rdsEnabled: boolean;
    public abstract rdsCount: number;
    public rdsContents: Array<I> = [];

    public static clone(base: LootTable): LootTable {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const n: LootTable = new (<any>base.constructor)();
        n.rdsContents = [...base.rdsContents];
        return n;
    }

    public add(entry: I, probability?: number, count?: number): this {
        if (typeof probability !== "undefined" || typeof count !== "undefined") {
            if ("rdsContents" in entry) {
                entry = <never>LootTable.clone(<never>entry);
                (<LootTable><unknown>entry).rdsCount = count ?? (<LootTable><unknown>entry).rdsCount;
            }
            entry.rdsProbability = probability ?? entry.rdsProbability;
        }
        this.rdsContents.push(entry);
        return this;
    }

    public resultsBetween(min: number, max: number): Array<I> {
        const currentCount = this.rdsCount;
        this.rdsCount = getRandomIntInclusive(min, max);
        const results = this.rdsResults();
        this.rdsCount = currentCount;
        return <never>results;
    }

    public rdsResults(): Array<I> {
        const uniqueDrops = new Set();
        const rv: Array<I> = [];
        const droppable: Array<I> = [];
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

                        rv.push(object);
                        this.onRDSHit?.(object);

                        break;
                    }
                }
            }
        }

        if (typeof this.onRDSPostResultEvaluation !== "undefined")
            for (let i = 0, { length } = rv; i < length; i++) this.onRDSPostResultEvaluation(rv[i]);

        return <never>rv;
    }
}
