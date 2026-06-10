import { describe, expect, it } from "vitest";
import { normalizeTag, normalizeTagList } from "./tags";

describe("normalizeTag", () => {
  it("lowercases", () => {
    expect(normalizeTag("DSU")).toBe("dsu");
  });
  it("trims surrounding whitespace", () => {
    expect(normalizeTag("  dsu  ")).toBe("dsu");
  });
  it("collapses internal whitespace to a single hyphen", () => {
    expect(normalizeTag("binary search on answer")).toBe(
      "binary-search-on-answer",
    );
    expect(normalizeTag("Binary   Search\tOn\nAnswer")).toBe(
      "binary-search-on-answer",
    );
  });
  it("collapses runs of hyphens", () => {
    expect(normalizeTag("dp---bitmask")).toBe("dp-bitmask");
  });
  it("strips leading/trailing hyphens", () => {
    expect(normalizeTag(" -dp-")).toBe("dp");
  });
  it("returns empty for empty / whitespace input", () => {
    expect(normalizeTag("")).toBe("");
    expect(normalizeTag("   ")).toBe("");
  });
});

describe("normalizeTagList", () => {
  it("normalizes each tag and dedupes case-insensitively", () => {
    expect(normalizeTagList(["DSU", "dsu", "Binary Search", "binary-search"]))
      .toEqual(["dsu", "binary-search"]);
  });
  it("drops empty entries", () => {
    expect(normalizeTagList(["", "  ", "dp"])).toEqual(["dp"]);
  });
  it("preserves first-seen order", () => {
    expect(normalizeTagList(["b", "a", "b", "c"])).toEqual(["b", "a", "c"]);
  });
});
