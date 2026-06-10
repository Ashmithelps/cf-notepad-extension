import { describe, expect, it } from "vitest";
import {
  applyFilters,
  matchesRatingRange,
  matchesSearch,
  matchesTag,
} from "./dashboard-filters";
import type { Note } from "../db/types";

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    key: "cf:1A",
    platform: "cf",
    contestId: "1",
    index: "A",
    url: "https://codeforces.com/contest/1/problem/A",
    title: "Theatre Square",
    body: "use ceil division",
    techniqueTags: ["math"],
    rating: 1000,
    officialTags: ["math"],
    solved: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("matchesSearch", () => {
  const n = makeNote({ title: "Theatre Square", body: "ceiling division" });
  it("matches title case-insensitively", () => {
    expect(matchesSearch(n, "theatre")).toBe(true);
    expect(matchesSearch(n, "THEATRE")).toBe(true);
  });
  it("matches body case-insensitively", () => {
    expect(matchesSearch(n, "ceiling")).toBe(true);
  });
  it("returns true for empty query", () => {
    expect(matchesSearch(n, "")).toBe(true);
    expect(matchesSearch(n, "   ")).toBe(true);
  });
  it("returns false when not found in either", () => {
    expect(matchesSearch(n, "graphs")).toBe(false);
  });
  it("handles a note with no title", () => {
    expect(matchesSearch(makeNote({ title: undefined, body: "x" }), "x")).toBe(
      true,
    );
  });
});

describe("matchesTag", () => {
  it("returns true only when the tag is in techniqueTags", () => {
    const n = makeNote({ techniqueTags: ["dsu", "dp"] });
    expect(matchesTag(n, "dsu")).toBe(true);
    expect(matchesTag(n, "dp")).toBe(true);
    expect(matchesTag(n, "math")).toBe(false);
  });
});

describe("matchesRatingRange", () => {
  it("inclusive lower bound", () => {
    const n = makeNote({ rating: 1500 });
    expect(matchesRatingRange(n, 1500, undefined)).toBe(true);
    expect(matchesRatingRange(n, 1501, undefined)).toBe(false);
  });
  it("inclusive upper bound", () => {
    const n = makeNote({ rating: 1500 });
    expect(matchesRatingRange(n, undefined, 1500)).toBe(true);
    expect(matchesRatingRange(n, undefined, 1499)).toBe(false);
  });
  it("notes with no rating are excluded when a min is set", () => {
    const n = makeNote({ rating: undefined });
    expect(matchesRatingRange(n, 1000, undefined)).toBe(false);
  });
  it("notes with no rating pass when only a max is set", () => {
    const n = makeNote({ rating: undefined });
    expect(matchesRatingRange(n, undefined, 2000)).toBe(true);
  });
  it("returns true when no bounds are given", () => {
    expect(
      matchesRatingRange(makeNote(), undefined, undefined),
    ).toBe(true);
  });
});

describe("applyFilters", () => {
  const notes: Note[] = [
    makeNote({ key: "cf:1A", title: "Theatre Square", rating: 1000, techniqueTags: ["math"] }),
    makeNote({ key: "cf:2B", title: "Trees", rating: 1500, techniqueTags: ["dsu"] }),
    makeNote({ key: "cf:3C", title: "DP basics", rating: 1800, techniqueTags: ["dp"] }),
    makeNote({ key: "cf:4D", title: "Untagged", rating: undefined, techniqueTags: [] }),
  ];

  it("empty filter returns everything", () => {
    expect(applyFilters(notes, {}).length).toBe(4);
  });

  it("filters by tag", () => {
    const out = applyFilters(notes, { techniqueTag: "dsu" });
    expect(out.map((n) => n.key)).toEqual(["cf:2B"]);
  });

  it("combines query + rating range", () => {
    const out = applyFilters(notes, {
      query: "d",
      ratingMin: 1600,
      ratingMax: 1900,
    });
    expect(out.map((n) => n.key)).toEqual(["cf:3C"]);
  });

  it("rating range excludes notes with no rating when min set", () => {
    const out = applyFilters(notes, { ratingMin: 1000 });
    expect(out.map((n) => n.key)).toEqual(["cf:1A", "cf:2B", "cf:3C"]);
  });
});
