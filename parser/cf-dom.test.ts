import { describe, expect, it } from "vitest";
import { parseRating } from "./cf-dom";

describe("parseRating", () => {
  it("parses '*1500' to 1500", () => {
    expect(parseRating("*1500")).toBe(1500);
  });
  it("parses bare '1500' to 1500", () => {
    expect(parseRating("1500")).toBe(1500);
  });
  it("trims surrounding whitespace", () => {
    expect(parseRating("  *1500  ")).toBe(1500);
    expect(parseRating("\t*800\n")).toBe(800);
  });
  it("returns undefined for non-numeric input", () => {
    expect(parseRating("binary search")).toBeUndefined();
    expect(parseRating("*abc")).toBeUndefined();
    expect(parseRating("*")).toBeUndefined();
  });
  it("returns undefined for empty / nullish input", () => {
    expect(parseRating("")).toBeUndefined();
    expect(parseRating("   ")).toBeUndefined();
    expect(parseRating(null)).toBeUndefined();
    expect(parseRating(undefined)).toBeUndefined();
  });
  it("rejects mixed text like '*1500 binary search'", () => {
    expect(parseRating("*1500 binary search")).toBeUndefined();
  });
});
