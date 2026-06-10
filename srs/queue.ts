import type { Note } from "../db/types";
import { inRotation, isDue, normalizeStored } from "./schedule";

export function isInDueQueue(note: Note, now: number = Date.now()): boolean {
  const stored = normalizeStored(note.srs);
  return inRotation(stored) && isDue(stored, now);
}

export function dueQueue(notes: Note[], now: number = Date.now()): Note[] {
  return notes
    .filter((n) => isInDueQueue(n, now))
    .sort((a, b) => {
      const da = normalizeStored(a.srs)?.due ?? Infinity;
      const db = normalizeStored(b.srs)?.due ?? Infinity;
      return da - db; // most overdue first (smallest due timestamp)
    });
}
