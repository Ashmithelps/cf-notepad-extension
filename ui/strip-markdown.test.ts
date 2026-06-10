import { describe, expect, it } from "vitest";
import { stripMarkdown } from "./strip-markdown";

describe("stripMarkdown", () => {
  it("returns plain text unchanged", () => {
    expect(stripMarkdown("just a sentence")).toBe("just a sentence");
  });

  it("strips bold and italic markers", () => {
    expect(stripMarkdown("**bold** and *em* and __b__ and _e_")).toBe(
      "bold and em and b and e",
    );
  });

  it("strips inline code backticks but keeps content", () => {
    expect(stripMarkdown("use `binary_search` here")).toBe(
      "use binary_search here",
    );
  });

  it("strips fenced code block fences but keeps the code", () => {
    const input = "Try this:\n```cpp\nint x = 1;\n```\nand done";
    expect(stripMarkdown(input)).toBe("Try this:\nint x = 1;\nand done");
  });

  it("strips heading hashes", () => {
    expect(stripMarkdown("# Title\n## Sub\nBody")).toBe("Title\nSub\nBody");
  });

  it("strips list markers", () => {
    expect(stripMarkdown("- one\n- two\n1. first\n2. second")).toBe(
      "one\ntwo\nfirst\nsecond",
    );
  });

  it("strips blockquote markers", () => {
    expect(stripMarkdown("> quoted\n> more")).toBe("quoted\nmore");
  });

  it("rewrites links to their text", () => {
    expect(stripMarkdown("see [docs](https://x.test) for more")).toBe(
      "see docs for more",
    );
  });

  it("rewrites images to their alt text", () => {
    expect(stripMarkdown("![diagram](/x.png) caption")).toBe(
      "diagram caption",
    );
  });

  it("strips raw HTML tags", () => {
    expect(stripMarkdown("hello <b>world</b><br/>!")).toBe("hello world!");
  });

  it("collapses runs of blank lines", () => {
    expect(stripMarkdown("a\n\n\n\nb")).toBe("a\n\nb");
  });
});
