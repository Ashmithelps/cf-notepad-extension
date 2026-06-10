import { beforeEach, describe, expect, it } from "vitest";
import { parseProblemKey } from "../parser/codeforces";
import { MemoryNotesStore, NotesRepo, type Clock } from "./notes";
import type { ProblemKey } from "./types";

class FakeClock implements Clock {
  constructor(private t: number) {}
  now() {
    return this.t;
  }
  advance(ms: number) {
    this.t += ms;
  }
}

const pkey = (): ProblemKey =>
  parseProblemKey("https://codeforces.com/contest/1850/problem/A")!;

describe("NotesRepo", () => {
  let store: MemoryNotesStore;
  let clock: FakeClock;
  let repo: NotesRepo;

  beforeEach(() => {
    store = new MemoryNotesStore();
    clock = new FakeClock(1_000);
    repo = new NotesRepo(store, clock);
  });

  it("create → read returns the same note", async () => {
    const k = pkey();
    const created = await repo.create(k, {
      url: "https://codeforces.com/contest/1850/problem/A",
      title: "A. Ten Words of Wisdom",
      body: "initial body",
    });
    const fetched = await repo.get(k.key);
    expect(fetched).not.toBeNull();
    expect(fetched).toEqual(created);
    expect(fetched?.key).toBe("cf:1850A");
    expect(fetched?.body).toBe("initial body");
    expect(fetched?.solved).toBe(false);
    expect(fetched?.techniqueTags).toEqual([]);
    expect(fetched?.createdAt).toBe(1_000);
    expect(fetched?.updatedAt).toBe(1_000);
  });

  it("create initializes an FSRS card without scheduling logic", async () => {
    const k = pkey();
    const note = await repo.create(k, {
      url: "u",
      body: "",
    });
    expect(note.srs).toBeDefined();
    expect(note.srs).toMatchObject({
      reps: 0,
      lapses: 0,
    });
  });

  it("update changes body + updatedAt but not createdAt", async () => {
    const k = pkey();
    await repo.create(k, { url: "u", body: "v1" });
    clock.advance(5_000);
    const updated = await repo.update(k.key, { body: "v2" });
    expect(updated?.body).toBe("v2");
    expect(updated?.createdAt).toBe(1_000);
    expect(updated?.updatedAt).toBe(6_000);

    const refetched = await repo.get(k.key);
    expect(refetched?.body).toBe("v2");
    expect(refetched?.createdAt).toBe(1_000);
    expect(refetched?.updatedAt).toBe(6_000);
  });

  it("update on a missing key returns null without throwing", async () => {
    await expect(repo.update("cf:9999Z", { body: "x" })).resolves.toBeNull();
  });

  it("delete removes the note", async () => {
    const k = pkey();
    await repo.create(k, { url: "u", body: "v1" });
    await repo.delete(k.key);
    expect(await repo.get(k.key)).toBeNull();
  });

  it("delete on a missing key does not throw", async () => {
    await expect(repo.delete("cf:9999Z")).resolves.toBeUndefined();
  });

  it("get on a non-existent key returns null (not a throw)", async () => {
    await expect(repo.get("cf:404Z")).resolves.toBeNull();
  });

  it("list returns all stored notes", async () => {
    const k = pkey();
    await repo.create(k, { url: "u", body: "" });
    const all = await repo.list();
    expect(all.length).toBe(1);
    expect(all[0]?.key).toBe("cf:1850A");
  });

  it("distinctTechniqueTags aggregates across notes", async () => {
    const k = pkey();
    const n = await repo.create(k, { url: "u", body: "" });
    await repo.update(n.key, { techniqueTags: ["dp", "dsu"] });
    expect(await repo.distinctTechniqueTags()).toEqual(["dp", "dsu"]);
  });

  it("update normalizes technique tags", async () => {
    const k = pkey();
    await repo.create(k, { url: "u", body: "" });
    const updated = await repo.update(k.key, {
      techniqueTags: ["  DSU  ", "Binary Search", "dsu"],
    });
    expect(updated?.techniqueTags).toEqual(["dsu", "binary-search"]);
  });

  it("backfillMetadata fills only missing fields and never overwrites", async () => {
    const k = pkey();
    await repo.create(k, {
      url: "u",
      body: "",
      title: "existing title",
    });
    clock.advance(1000);
    const after = await repo.backfillMetadata(k.key, {
      title: "scraped title",
      rating: 1500,
      officialTags: ["math"],
    });
    expect(after?.title).toBe("existing title");
    expect(after?.rating).toBe(1500);
    expect(after?.officialTags).toEqual(["math"]);
  });

  it("backfillMetadata is a no-op when nothing is missing", async () => {
    const k = pkey();
    const created = await repo.create(k, {
      url: "u",
      body: "",
      title: "t",
      rating: 1500,
      officialTags: ["math"],
    });
    clock.advance(1000);
    const after = await repo.backfillMetadata(k.key, {
      title: "other",
      rating: 9999,
      officialTags: ["graphs"],
    });
    expect(after).toEqual(created);
    expect(after?.updatedAt).toBe(created.updatedAt);
  });

  it("write and read use the same canonical key (case-insensitive URL → uppercase key)", async () => {
    const upper = parseProblemKey(
      "https://codeforces.com/contest/1850/problem/A",
    )!;
    const lower = parseProblemKey(
      "https://codeforces.com/contest/1850/problem/a",
    )!;
    expect(upper.key).toBe(lower.key);

    await repo.create(upper, { url: "u", body: "shared" });
    // Looking up by the key derived from the lowercase URL finds the same note.
    const fetched = await repo.get(lower.key);
    expect(fetched?.body).toBe("shared");
  });
});
