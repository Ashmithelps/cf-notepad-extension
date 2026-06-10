import { describe, expect, it } from "vitest";
import {
  buildEnvelope,
  EXPORT_VERSION,
  mergeNotes,
  validateEnvelope,
} from "./transfer";
import type { Note } from "./types";

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    key: "cf:1A",
    platform: "cf",
    contestId: "1",
    index: "A",
    url: "https://codeforces.com/contest/1/problem/A",
    techniqueTags: [],
    body: "",
    solved: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("mergeNotes", () => {
  it("inserts incoming notes whose key is absent locally", () => {
    const local: Note[] = [makeNote({ key: "cf:1A" })];
    const incoming: Note[] = [makeNote({ key: "cf:2B" })];
    const r = mergeNotes(local, incoming);
    expect(r.added).toBe(1);
    expect(r.updated).toBe(0);
    expect(r.skipped).toBe(0);
    expect(r.result.map((n) => n.key).sort()).toEqual(["cf:1A", "cf:2B"]);
  });

  it("updates when incoming.updatedAt is newer", () => {
    const local = [makeNote({ key: "cf:1A", body: "old", updatedAt: 100 })];
    const incoming = [makeNote({ key: "cf:1A", body: "new", updatedAt: 200 })];
    const r = mergeNotes(local, incoming);
    expect(r.updated).toBe(1);
    expect(r.added + r.skipped).toBe(0);
    expect(r.result[0]?.body).toBe("new");
  });

  it("skips when incoming is older or equal", () => {
    const local = [makeNote({ key: "cf:1A", body: "keep", updatedAt: 200 })];
    const olderInc = [makeNote({ key: "cf:1A", body: "stale", updatedAt: 100 })];
    const equalInc = [makeNote({ key: "cf:1A", body: "stale", updatedAt: 200 })];
    expect(mergeNotes(local, olderInc).skipped).toBe(1);
    expect(mergeNotes(local, equalInc).skipped).toBe(1);
    expect(mergeNotes(local, olderInc).result[0]?.body).toBe("keep");
  });

  it("never mutates the input arrays or their elements", () => {
    const local = [makeNote({ key: "cf:1A", body: "old", updatedAt: 100 })];
    const incoming = [makeNote({ key: "cf:1A", body: "new", updatedAt: 200 })];
    const localSnapshot = JSON.stringify(local);
    const incomingSnapshot = JSON.stringify(incoming);
    mergeNotes(local, incoming);
    expect(JSON.stringify(local)).toBe(localSnapshot);
    expect(JSON.stringify(incoming)).toBe(incomingSnapshot);
  });

  it("counts add/update/skip in one mixed run", () => {
    const local = [
      makeNote({ key: "cf:1A", updatedAt: 100 }),
      makeNote({ key: "cf:2B", updatedAt: 100 }),
    ];
    const incoming = [
      makeNote({ key: "cf:1A", updatedAt: 200 }), // update
      makeNote({ key: "cf:2B", updatedAt: 50 }),  // skip
      makeNote({ key: "cf:3C", updatedAt: 0 }),   // add
    ];
    const r = mergeNotes(local, incoming);
    expect(r.added).toBe(1);
    expect(r.updated).toBe(1);
    expect(r.skipped).toBe(1);
    expect(r.result.length).toBe(3);
  });
});

describe("buildEnvelope", () => {
  it("produces the expected envelope shape", () => {
    const e = buildEnvelope([makeNote()], 1234);
    expect(e.version).toBe(EXPORT_VERSION);
    expect(e.exportedAt).toBe(1234);
    expect(e.notes.length).toBe(1);
  });

  it("export → validateEnvelope round-trips and merges into empty store identically", () => {
    const original: Note[] = [
      makeNote({
        key: "cf:1A",
        body: "v1",
        updatedAt: 100,
        techniqueTags: ["dp"],
      }),
      makeNote({ key: "cf:2B", body: "v2", updatedAt: 200, rating: 1500 }),
    ];
    const env = buildEnvelope(original);
    const json = JSON.stringify(env);
    const parsed = validateEnvelope(JSON.parse(json));
    const merged = mergeNotes([], parsed.notes);
    expect(merged.added).toBe(2);
    expect(merged.result).toEqual(original);
  });
});

describe("validateEnvelope (malformed inputs)", () => {
  it("rejects non-objects", () => {
    expect(() => validateEnvelope(null)).toThrow();
    expect(() => validateEnvelope([])).toThrow();
    expect(() => validateEnvelope("hello")).toThrow();
  });
  it("rejects missing or wrong-typed top-level fields", () => {
    expect(() => validateEnvelope({})).toThrow(/version/);
    expect(() => validateEnvelope({ version: "1" })).toThrow(/version/);
    expect(() => validateEnvelope({ version: 1, exportedAt: 0 })).toThrow(/notes/);
  });
  it("rejects notes missing required fields", () => {
    const bad = { version: 1, exportedAt: 0, notes: [{ key: "cf:1A" }] };
    expect(() => validateEnvelope(bad)).toThrow();
  });
  it("rejects unknown platform values", () => {
    const bad = {
      version: 1,
      exportedAt: 0,
      notes: [
        {
          key: "x:1A",
          platform: "x",
          contestId: "1",
          index: "A",
          url: "u",
          techniqueTags: [],
          body: "",
          solved: false,
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    };
    expect(() => validateEnvelope(bad)).toThrow();
  });
});
