import type { Note, Platform } from "./types";

export const EXPORT_VERSION = 1;

export interface Envelope {
  version: number;
  exportedAt: number;
  notes: Note[];
}

export interface MergeReport {
  result: Note[];
  added: number;
  updated: number;
  skipped: number;
}

/**
 * Pure merge: never mutates either input. For each incoming note,
 *   - no local with the same key → insert (added++)
 *   - local exists, incoming.updatedAt > local.updatedAt → replace (updated++)
 *   - otherwise → keep local (skipped++)
 */
export function mergeNotes(local: Note[], incoming: Note[]): MergeReport {
  const result: Note[] = local.map((n) => ({ ...n }));
  const indexByKey = new Map<string, number>();
  result.forEach((n, i) => indexByKey.set(n.key, i));

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const inc of incoming) {
    const incCopy: Note = { ...inc };
    const idx = indexByKey.get(incCopy.key);
    if (idx === undefined) {
      result.push(incCopy);
      indexByKey.set(incCopy.key, result.length - 1);
      added += 1;
      continue;
    }
    const existing = result[idx]!;
    if (incCopy.updatedAt > existing.updatedAt) {
      result[idx] = incCopy;
      updated += 1;
    } else {
      skipped += 1;
    }
  }

  return { result, added, updated, skipped };
}

export function buildEnvelope(notes: Note[], now: number = Date.now()): Envelope {
  return {
    version: EXPORT_VERSION,
    exportedAt: now,
    notes: notes.map((n) => ({ ...n })),
  };
}

const VALID_PLATFORMS: ReadonlySet<Platform> = new Set([
  "cf",
  "atcoder",
  "codechef",
  "leetcode",
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateNote(raw: unknown, idx: number): Note {
  if (!isPlainObject(raw)) {
    throw new Error(`note[${idx}] is not an object`);
  }
  const r = raw;
  const required = [
    "key",
    "platform",
    "contestId",
    "index",
    "url",
    "techniqueTags",
    "body",
    "solved",
    "createdAt",
    "updatedAt",
  ];
  for (const k of required) {
    if (!(k in r)) throw new Error(`note[${idx}] missing required field: ${k}`);
  }
  if (typeof r["key"] !== "string" || r["key"].length === 0) {
    throw new Error(`note[${idx}].key invalid`);
  }
  if (typeof r["platform"] !== "string" || !VALID_PLATFORMS.has(r["platform"] as Platform)) {
    throw new Error(`note[${idx}].platform invalid`);
  }
  if (!Array.isArray(r["techniqueTags"])) {
    throw new Error(`note[${idx}].techniqueTags must be an array`);
  }
  if (typeof r["body"] !== "string") {
    throw new Error(`note[${idx}].body must be a string`);
  }
  if (typeof r["solved"] !== "boolean") {
    throw new Error(`note[${idx}].solved must be a boolean`);
  }
  if (typeof r["createdAt"] !== "number" || typeof r["updatedAt"] !== "number") {
    throw new Error(`note[${idx}] timestamps must be numbers`);
  }
  return r as unknown as Note;
}

export function validateEnvelope(raw: unknown): Envelope {
  if (!isPlainObject(raw)) {
    throw new Error("file is not a JSON object");
  }
  if (typeof raw["version"] !== "number") {
    throw new Error("missing or invalid 'version'");
  }
  if (typeof raw["exportedAt"] !== "number") {
    throw new Error("missing or invalid 'exportedAt'");
  }
  if (!Array.isArray(raw["notes"])) {
    throw new Error("missing or invalid 'notes' array");
  }
  const notes = raw["notes"].map((n, i) => validateNote(n, i));
  return {
    version: raw["version"],
    exportedAt: raw["exportedAt"],
    notes,
  };
}

export function envelopeFilename(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `cf-recall-backup-${y}-${m}-${d}.json`;
}
