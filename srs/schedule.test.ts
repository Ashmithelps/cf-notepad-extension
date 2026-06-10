import { describe, expect, it } from "vitest";
import {
  createInitialCard,
  fromStorage,
  inRotation,
  isDue,
  normalizeStored,
  schedule,
  toStorage,
} from "./schedule";
import { dueQueue, isInDueQueue } from "./queue";
import type { Note } from "../db/types";

const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

describe("createInitialCard", () => {
  it("returns a fresh card with reps=0 and a due timestamp", () => {
    const c = createInitialCard(NOW);
    expect(c.reps).toBe(0);
    expect(typeof c.due).toBe("number");
    expect(c.lapses).toBe(0);
  });
});

describe("schedule", () => {
  it("Again < Good < Easy in next due date (monotonic intervals)", () => {
    const card = createInitialCard(NOW);
    const again = schedule(card, "Again", NOW);
    const good = schedule(card, "Good", NOW);
    const easy = schedule(card, "Easy", NOW);
    expect(again.due).toBeLessThan(good.due);
    expect(good.due).toBeLessThan(easy.due);
  });

  it("Hard sits between Again and Easy", () => {
    const card = createInitialCard(NOW);
    const again = schedule(card, "Again", NOW);
    const hard = schedule(card, "Hard", NOW);
    const easy = schedule(card, "Easy", NOW);
    expect(hard.due).toBeGreaterThanOrEqual(again.due);
    expect(hard.due).toBeLessThanOrEqual(easy.due);
  });

  it("Good and Easy push due strictly after now", () => {
    const card = createInitialCard(NOW);
    expect(schedule(card, "Good", NOW).due).toBeGreaterThan(NOW);
    expect(schedule(card, "Easy", NOW).due).toBeGreaterThan(NOW);
  });

  it("increments reps after the first rating", () => {
    const card = createInitialCard(NOW);
    const after = schedule(card, "Good", NOW);
    expect(after.reps).toBeGreaterThan(0);
  });

  it("works when called with an undefined card (treats it as fresh)", () => {
    const out = schedule(undefined, "Good", NOW);
    expect(out.reps).toBeGreaterThan(0);
    expect(out.due).toBeGreaterThan(NOW);
  });
});

describe("isDue", () => {
  it("true when due <= now", () => {
    const card = createInitialCard(NOW);
    expect(isDue({ ...card, due: NOW - 1000 }, NOW)).toBe(true);
    expect(isDue({ ...card, due: NOW }, NOW)).toBe(true);
  });
  it("false when due > now", () => {
    const card = createInitialCard(NOW);
    expect(isDue({ ...card, due: NOW + 1000 }, NOW)).toBe(false);
  });
  it("false for undefined card", () => {
    expect(isDue(undefined, NOW)).toBe(false);
  });
});

describe("toStorage / fromStorage round-trip", () => {
  it("preserves all numeric and date fields losslessly", () => {
    const card = createInitialCard(NOW);
    const rated = schedule(card, "Hard", NOW);
    const hydrated = fromStorage(rated);
    const back = toStorage(hydrated);
    expect(back).toEqual(rated);
  });

  it("preserves last_review when present", () => {
    const card = schedule(createInitialCard(NOW), "Good", NOW);
    expect(card.last_review).toBeDefined();
    const back = toStorage(fromStorage(card));
    expect(back.last_review).toBe(card.last_review);
  });
});

describe("normalizeStored", () => {
  it("accepts a clean stored card", () => {
    const card = createInitialCard(NOW);
    expect(normalizeStored(card)).toEqual(card);
  });
  it("accepts a legacy ts-fsrs Card with Date fields", () => {
    const legacy = {
      due: new Date(NOW + 1000),
      stability: 0.5,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 1,
      lapses: 0,
      state: 1,
      last_review: new Date(NOW),
    };
    const out = normalizeStored(legacy);
    expect(out?.due).toBe(NOW + 1000);
    expect(out?.last_review).toBe(NOW);
  });
  it("returns undefined for garbage", () => {
    expect(normalizeStored(null)).toBeUndefined();
    expect(normalizeStored({ foo: 1 })).toBeUndefined();
  });
});

describe("inRotation", () => {
  it("false for an empty card", () => {
    expect(inRotation(createInitialCard(NOW))).toBe(false);
  });
  it("true after the first rating", () => {
    expect(inRotation(schedule(createInitialCard(NOW), "Good", NOW))).toBe(true);
  });
});

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    key: "cf:1A",
    platform: "cf",
    contestId: "1",
    index: "A",
    url: "u",
    techniqueTags: [],
    body: "",
    solved: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe("dueQueue (inRotation && isDue)", () => {
  const card = createInitialCard(NOW);

  it("excludes notes that have never been rated", () => {
    const n = makeNote({ srs: card });
    expect(isInDueQueue(n, NOW)).toBe(false);
    expect(dueQueue([n], NOW)).toEqual([]);
  });

  it("includes rated notes whose due <= now", () => {
    const rated = schedule(card, "Again", NOW);
    const overdue = { ...rated, due: NOW - 1000 };
    const n = makeNote({ srs: overdue });
    expect(isInDueQueue(n, NOW)).toBe(true);
    expect(dueQueue([n], NOW)).toHaveLength(1);
  });

  it("excludes rated notes whose due > now", () => {
    const rated = schedule(card, "Good", NOW);
    expect(isInDueQueue(makeNote({ srs: rated }), NOW)).toBe(false);
  });

  it("orders most overdue first", () => {
    const r = schedule(card, "Again", NOW);
    const a = makeNote({ key: "cf:1A", srs: { ...r, due: NOW - 1000 } });
    const b = makeNote({ key: "cf:2B", srs: { ...r, due: NOW - 5000 } });
    const c = makeNote({ key: "cf:3C", srs: { ...r, due: NOW - 100 } });
    const ordered = dueQueue([a, b, c], NOW);
    expect(ordered.map((n) => n.key)).toEqual(["cf:2B", "cf:1A", "cf:3C"]);
  });
});
