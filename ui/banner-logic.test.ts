import { describe, expect, it } from "vitest";
import { previewBody, shouldShowBanner } from "./banner-logic";

describe("previewBody", () => {
  it("returns short bodies as-is", () => {
    expect(previewBody("hello world")).toBe("hello world");
  });

  it("returns empty string for empty input", () => {
    expect(previewBody("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(previewBody("   \n\t  ")).toBe("");
  });

  it("trims leading/trailing whitespace before measuring", () => {
    expect(previewBody("  hi  ")).toBe("hi");
  });

  it("truncates bodies longer than the limit with an ellipsis", () => {
    const body = "a".repeat(250);
    const out = previewBody(body, 200);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBe(201);
    expect(out.slice(0, 200)).toBe("a".repeat(200));
  });

  it("respects a custom limit", () => {
    expect(previewBody("abcdef", 3)).toBe("abc…");
  });

  it("does not add ellipsis when body is exactly at the limit", () => {
    const body = "x".repeat(200);
    expect(previewBody(body, 200)).toBe(body);
  });
});

describe("shouldShowBanner", () => {
  const base = {
    noteExists: true,
    dismissedThisSession: false,
    bannerEnabled: true,
    panelOpen: false,
  };

  it("shows when a note exists and nothing suppresses it", () => {
    expect(shouldShowBanner(base)).toBe(true);
  });

  it("hides when no note exists", () => {
    expect(shouldShowBanner({ ...base, noteExists: false })).toBe(false);
  });

  it("hides when dismissed this session", () => {
    expect(shouldShowBanner({ ...base, dismissedThisSession: true })).toBe(
      false,
    );
  });

  it("hides when banner is disabled in settings", () => {
    expect(shouldShowBanner({ ...base, bannerEnabled: false })).toBe(false);
  });

  it("hides when the side panel is open", () => {
    expect(shouldShowBanner({ ...base, panelOpen: true })).toBe(false);
  });
});
