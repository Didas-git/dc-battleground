import type * as BoardLayer from "../../schemas/board-layer.js";

const importExtension = import.meta.filename.split(".").at(-1);
console.log(new URL(`refresh.${importExtension}`, import.meta.url).href);
const refreshWorker = new Worker(new URL(`refresh.${importExtension}`, import.meta.url).href);
// Uncomment this line and you still get infinite loop but no crash
// refreshWorker.unref();
let isRunning = false;

export const enum WorkerDataType {
    Done,
    Error
}

export interface WorkerData {
    type: WorkerDataType;
    quantity: { chests: number, mobs: number };
    time: { chests: string, mobs: string };
}

export interface RefreshData {
    guildId: string;
    layer: BoardLayer.BoardLayer;
}

export function offloadRefresh(data: RefreshData, callback: (data: WorkerData) => Promise<unknown>): void {
    if (isRunning) setTimeout(() => { offloadRefresh(data, callback); }, 1000);
    isRunning = true;

    refreshWorker.addEventListener("message", async (event: MessageEvent<WorkerData>) => {
        if (event.data.type !== WorkerDataType.Done) return;
        isRunning = false;
        await callback(event.data);
    }, { once: true });
    refreshWorker.postMessage(data);
}
