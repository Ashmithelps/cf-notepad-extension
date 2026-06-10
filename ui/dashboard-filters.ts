import type { Note, Platform } from "../db/types";

export interface Filters {
  query?: string;
  techniqueTag?: string;
  ratingMin?: number;
  ratingMax?: number;
  platform?: Platform;
}

export type SortKey = "updatedAt" | "rating";
export type SortDir = "asc" | "desc";

export function matchesSearch(note: Note, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const title = note.title?.toLowerCase() ?? "";
  const body = note.body.toLowerCase();
  return title.includes(q) || body.includes(q);
}

export function matchesTag(note: Note, tag: string): boolean {
  return note.techniqueTags.includes(tag);
}

export function matchesRatingRange(
  note: Note,
  min: number | undefined,
  max: number | undefined,
): boolean {
  if (min !== undefined) {
    if (note.rating === undefined) return false;
    if (note.rating < min) return false;
  }
  if (max !== undefined) {
    if (note.rating !== undefined && note.rating > max) return false;
  }
  return true;
}

export function matchesPlatform(note: Note, platform: Platform): boolean {
  return note.platform === platform;
}

export function applyFilters(notes: Note[], f: Filters): Note[] {
  return notes.filter((n) => {
    if (f.query !== undefined && !matchesSearch(n, f.query)) return false;
    if (f.techniqueTag && !matchesTag(n, f.techniqueTag)) return false;
    if (
      (f.ratingMin !== undefined || f.ratingMax !== undefined) &&
      !matchesRatingRange(n, f.ratingMin, f.ratingMax)
    )
      return false;
    if (f.platform && !matchesPlatform(n, f.platform)) return false;
    return true;
  });
}

export function sortNotes(
  notes: Note[],
  key: SortKey,
  dir: SortDir,
): Note[] {
  const mul = dir === "asc" ? 1 : -1;
  const sorted = [...notes];
  sorted.sort((a, b) => {
    if (key === "rating") {
      const ar = a.rating ?? -Infinity;
      const br = b.rating ?? -Infinity;
      return (ar - br) * mul;
    }
    return (a.updatedAt - b.updatedAt) * mul;
  });
  return sorted;
}
