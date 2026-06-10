import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade as FsrsGrade,
} from "ts-fsrs";

export type Grade = "Again" | "Hard" | "Good" | "Easy";

/**
 * JSON-safe form of a ts-fsrs Card. Dates are stored as epoch-ms numbers so the
 * record round-trips cleanly through IndexedDB and any export/import we add
 * later. Every FSRS call inside this module goes Card ↔ StoredCard at the
 * boundary; the rest of the app only touches StoredCard.
 */
export interface StoredCard {
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: number;
}

const RATING_MAP: Record<Grade, Rating> = {
  Again: Rating.Again,
  Hard: Rating.Hard,
  Good: Rating.Good,
  Easy: Rating.Easy,
};

export const GRADES: Grade[] = ["Again", "Hard", "Good", "Easy"];

// Disable fuzz so test ordering and human-facing intervals stay deterministic.
const scheduler = fsrs(generatorParameters({ enable_fuzz: false }));

function asDate(t: Date | number): Date {
  return t instanceof Date ? t : new Date(t);
}

function dateToMs(d: Date | number | undefined): number | undefined {
  if (d === undefined) return undefined;
  if (typeof d === "number") return d;
  return d.getTime();
}

export function toStorage(card: Card): StoredCard {
  const out: StoredCard = {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
  };
  if (card.last_review) out.last_review = card.last_review.getTime();
  return out;
}

export function fromStorage(stored: StoredCard): Card {
  const card: Card = {
    due: new Date(stored.due),
    stability: stored.stability,
    difficulty: stored.difficulty,
    elapsed_days: stored.elapsed_days,
    scheduled_days: stored.scheduled_days,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state as State,
  };
  if (stored.last_review !== undefined) {
    card.last_review = new Date(stored.last_review);
  }
  return card;
}

/**
 * Tolerant rehydration for cards stored by older versions of this code (M2–M5)
 * that wrote `Date` objects directly via Dexie's structured clone. Accepts
 * either Dates or epoch numbers on any time field and produces a clean
 * StoredCard.
 */
export function normalizeStored(raw: unknown): StoredCard | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (
    typeof r["stability"] !== "number" ||
    typeof r["reps"] !== "number" ||
    typeof r["state"] !== "number"
  ) {
    return undefined;
  }
  const dueMs = dateToMs(r["due"] as Date | number | undefined);
  if (dueMs === undefined) return undefined;
  const out: StoredCard = {
    due: dueMs,
    stability: r["stability"],
    difficulty: (r["difficulty"] as number) ?? 0,
    elapsed_days: (r["elapsed_days"] as number) ?? 0,
    scheduled_days: (r["scheduled_days"] as number) ?? 0,
    reps: r["reps"],
    lapses: (r["lapses"] as number) ?? 0,
    state: r["state"],
  };
  const lr = dateToMs(r["last_review"] as Date | number | undefined);
  if (lr !== undefined) out.last_review = lr;
  return out;
}

export function createInitialCard(now: Date | number = Date.now()): StoredCard {
  return toStorage(createEmptyCard(asDate(now)));
}

export function schedule(
  stored: StoredCard | undefined,
  grade: Grade,
  now: Date | number = Date.now(),
): StoredCard {
  const card = stored ? fromStorage(stored) : createEmptyCard(asDate(now));
  const result = scheduler.next(card, asDate(now), RATING_MAP[grade] as FsrsGrade);
  return toStorage(result.card);
}

export function isDue(
  stored: StoredCard | undefined,
  now: Date | number = Date.now(),
): boolean {
  if (!stored) return false;
  const t = typeof now === "number" ? now : now.getTime();
  return stored.due <= t;
}

/** A note enters review rotation the first time it's rated (reps becomes > 0). */
export function inRotation(stored: StoredCard | undefined): boolean {
  return !!stored && stored.reps > 0;
}

/** Format an interval between two epoch-ms instants into a short human string. */
export function formatInterval(fromMs: number, toMs: number): string {
  const diff = toMs - fromMs;
  if (diff <= 0) return "now";
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 1 / 24) {
    const mins = Math.max(1, Math.round(diff / 60000));
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  if (days < 1) {
    const hours = Math.max(1, Math.round(diff / 3600000));
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const d = Math.round(days);
  return `${d} day${d === 1 ? "" : "s"}`;
}
