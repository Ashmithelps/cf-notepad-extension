import { describe, expect, it } from "vitest";
import { parseProblemKey } from "./codeforces";

describe("parseProblemKey", () => {
  it("parses /problemset/problem/{c}/{i}", () => {
    expect(
      parseProblemKey("https://codeforces.com/problemset/problem/1850/A"),
    ).toEqual({
      platform: "cf",
      contestId: "1850",
      index: "A",
      key: "cf:1850A",
    });
  });

  it("parses /contest/{c}/problem/{i}", () => {
    expect(
      parseProblemKey("https://codeforces.com/contest/1850/problem/A"),
    ).toEqual({
      platform: "cf",
      contestId: "1850",
      index: "A",
      key: "cf:1850A",
    });
  });

  it("parses /gym/{c}/problem/{i}", () => {
    expect(
      parseProblemKey("https://codeforces.com/gym/104555/problem/B"),
    ).toEqual({
      platform: "cf",
      contestId: "104555",
      index: "B",
      key: "cf:104555B",
    });
  });

  it("parses group contest URLs", () => {
    expect(
      parseProblemKey(
        "https://codeforces.com/group/abc123/contest/567/problem/C",
      ),
    ).toEqual({
      platform: "cf",
      contestId: "567",
      index: "C",
      key: "cf:567C",
    });
  });

  it("handles multi-char index like E1, E2", () => {
    expect(
      parseProblemKey("https://codeforces.com/contest/1900/problem/E1"),
    ).toEqual({
      platform: "cf",
      contestId: "1900",
      index: "E1",
      key: "cf:1900E1",
    });
    expect(
      parseProblemKey("https://codeforces.com/problemset/problem/1900/E2"),
    ).toEqual({
      platform: "cf",
      contestId: "1900",
      index: "E2",
      key: "cf:1900E2",
    });
  });

  it("normalizes lowercase index to uppercase", () => {
    expect(
      parseProblemKey("https://codeforces.com/contest/1850/problem/a"),
    )?.toMatchObject({ index: "A", key: "cf:1850A" });
  });

  it("accepts www. host", () => {
    expect(
      parseProblemKey("https://www.codeforces.com/contest/1/problem/A"),
    )?.toMatchObject({ key: "cf:1A" });
  });

  it("tolerates trailing slash", () => {
    expect(
      parseProblemKey("https://codeforces.com/contest/1/problem/A/"),
    )?.toMatchObject({ key: "cf:1A" });
  });

  it("ignores query strings and hashes", () => {
    expect(
      parseProblemKey(
        "https://codeforces.com/contest/1/problem/A?locale=en#submit",
      ),
    )?.toMatchObject({ key: "cf:1A" });
  });

  it("returns null for non-problem pages", () => {
    expect(parseProblemKey("https://codeforces.com/")).toBeNull();
    expect(parseProblemKey("https://codeforces.com/problemset")).toBeNull();
    expect(
      parseProblemKey("https://codeforces.com/contest/1850"),
    ).toBeNull();
    expect(
      parseProblemKey("https://codeforces.com/contest/1850/standings"),
    ).toBeNull();
    expect(parseProblemKey("https://codeforces.com/profile/tourist")).toBeNull();
  });

  it("returns null for other domains", () => {
    expect(
      parseProblemKey("https://example.com/contest/1/problem/A"),
    ).toBeNull();
    expect(
      parseProblemKey("https://atcoder.jp/contests/abc100/tasks/abc100_a"),
    ).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(parseProblemKey("")).toBeNull();
    expect(parseProblemKey("not a url")).toBeNull();
    expect(parseProblemKey("javascript:alert(1)")).toBeNull();
  });
});
