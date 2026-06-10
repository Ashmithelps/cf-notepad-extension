import { createInitialCard, normalizeStored, schedule, type Grade } from "../srs/schedule";
import { normalizeTagList } from "../ui/tags";
import type { Note, ProblemKey } from "./types";

export interface NotesStore {
  get(key: string): Promise<Note | undefined>;
  put(note: Note): Promise<void>;
  delete(key: string): Promise<void>;
  toArray(): Promise<Note[]>;
}

export interface CreateNoteInput {
  url: string;
  title?: string;
  rating?: number;
  officialTags?: string[];
  body: string;
}

export interface UpdateNoteInput {
  body?: string;
  techniqueTags?: string[];
  title?: string;
  rating?: number;
  officialTags?: string[];
}

export interface MetadataPatch {
  title?: string;
  rating?: number;
  officialTags?: string[];
}

export interface Clock {
  now(): number;
}

const systemClock: Clock = { now: () => Date.now() };

export class NotesRepo {
  constructor(
    private readonly store: NotesStore,
    private readonly clock: Clock = systemClock,
  ) {}

  async get(key: string): Promise<Note | null> {
    const n = await this.store.get(key);
    return n ?? null;
  }

  async list(): Promise<Note[]> {
    return this.store.toArray();
  }

  async distinctTechniqueTags(): Promise<string[]> {
    const all = await this.store.toArray();
    const set = new Set<string>();
    for (const n of all) for (const t of n.techniqueTags) set.add(t);
    return [...set].sort();
  }

  async create(pkey: ProblemKey, input: CreateNoteInput): Promise<Note> {
    const ts = this.clock.now();
    const note: Note = {
      key: pkey.key,
      platform: pkey.platform,
      contestId: pkey.contestId,
      index: pkey.index,
      url: input.url,
      title: input.title,
      rating: input.rating,
      officialTags: input.officialTags,
      techniqueTags: [],
      body: input.body,
      solved: false,
      createdAt: ts,
      updatedAt: ts,
      srs: createInitialCard(ts),
    };
    await this.store.put(note);
    return note;
  }

  async update(key: string, patch: UpdateNoteInput): Promise<Note | null> {
    const existing = await this.store.get(key);
    if (!existing) return null;
    const updated: Note = {
      ...existing,
      ...(patch.body !== undefined ? { body: patch.body } : {}),
      ...(patch.techniqueTags !== undefined
        ? { techniqueTags: normalizeTagList(patch.techniqueTags) }
        : {}),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.rating !== undefined ? { rating: patch.rating } : {}),
      ...(patch.officialTags !== undefined
        ? { officialTags: patch.officialTags }
        : {}),
      updatedAt: this.clock.now(),
    };
    await this.store.put(updated);
    return updated;
  }

  /**
   * Fill in metadata fields ONLY when the existing note has them empty. Never
   * overwrites a field that already has a value. Does not bump updatedAt if
   * nothing actually changed.
   */
  async backfillMetadata(
    key: string,
    meta: MetadataPatch,
  ): Promise<Note | null> {
    const existing = await this.store.get(key);
    if (!existing) return null;
    let changed = false;
    const next: Note = { ...existing };
    if (meta.title && !existing.title) {
      next.title = meta.title;
      changed = true;
    }
    if (meta.rating !== undefined && existing.rating === undefined) {
      next.rating = meta.rating;
      changed = true;
    }
    if (
      meta.officialTags &&
      meta.officialTags.length > 0 &&
      (!existing.officialTags || existing.officialTags.length === 0)
    ) {
      next.officialTags = meta.officialTags;
      changed = true;
    }
    if (!changed) return existing;
    next.updatedAt = this.clock.now();
    await this.store.put(next);
    return next;
  }

  async rate(key: string, grade: Grade): Promise<Note | null> {
    const existing = await this.store.get(key);
    if (!existing) return null;
    const ts = this.clock.now();
    const current = normalizeStored(existing.srs);
    const nextCard = schedule(current, grade, ts);
    const updated: Note = {
      ...existing,
      srs: nextCard,
      solved: true,
      updatedAt: ts,
    };
    await this.store.put(updated);
    return updated;
  }

  async delete(key: string): Promise<void> {
    await this.store.delete(key);
  }
}

export class MemoryNotesStore implements NotesStore {
  private readonly map = new Map<string, Note>();
  async get(key: string): Promise<Note | undefined> {
    const n = this.map.get(key);
    return n ? structuredClone(n) : undefined;
  }
  async put(note: Note): Promise<void> {
    this.map.set(note.key, structuredClone(note));
  }
  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
  async toArray(): Promise<Note[]> {
    return [...this.map.values()].map((n) => structuredClone(n));
  }
}
