import { Database } from "bun:sqlite";
import { join } from "node:path";

const DB_PATH = join(import.meta.dir, "../db/main.db");

// new Database cant create folders for some reason
if (!await Bun.file(DB_PATH).exists()) await Bun.write(DB_PATH, " ");

export const db = new Database(DB_PATH, { strict: true, readwrite: true });
db.run("PRAGMA journal_mode = WAL;");
