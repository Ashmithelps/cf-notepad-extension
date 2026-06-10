import Dexie, { type EntityTable } from "dexie";
import { NotesRepo, type NotesStore } from "./notes";
import { DEFAULT_SETTINGS, type Note, type Settings } from "./types";

/**
 * Schema versions are additive — older versions are kept so existing user
 * databases upgrade cleanly. Adding new indexes is a no-op data migration.
 */
export class CfRecallDB extends Dexie {
  notes!: EntityTable<Note, "key">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("cf-recall");
    // v1 — initial schema (M2).
    this.version(1).stores({
      notes: "&key, updatedAt, *officialTags",
      settings: "&id",
    });
    // v2 (M5) — adds explicit indexes for the dashboard's tag/rating/platform
    // filters and the technique-tag pattern-library lookup. Additive only:
    // no field changes, no data rewrite.
    this.version(2).stores({
      notes:
        "&key, platform, contestId, index, rating, solved, updatedAt, *techniqueTags, *officialTags",
    });
  }
}

export const db = new CfRecallDB();

function dexieNotesStore(table: EntityTable<Note, "key">): NotesStore {
  return {
    get: (k) => table.get(k),
    put: async (n) => {
      await table.put(n);
    },
    delete: async (k) => {
      await table.delete(k);
    },
    toArray: () => table.toArray(),
  };
}

export const notesRepo = new NotesRepo(dexieNotesStore(db.notes));

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get("singleton");
  if (s) return s;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export { NotesRepo } from "./notes";
