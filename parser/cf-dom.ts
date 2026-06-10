/**
 * All Codeforces DOM scraping lives here. Selectors are centralized so a
 * site-side markup change touches exactly one file. Every helper is
 * defensive: missing fields return undefined, never throw.
 */

export interface ScrapedMetadata {
  title?: string;
  rating?: number;
  officialTags?: string[];
}

/**
 * Pure helper exposed for tests: parse "*1500", "  *1500 ", "1500" → 1500.
 * Anything else (empty, "binary search", "*abc") → undefined.
 */
export function parseRating(text: string | null | undefined): number | undefined {
  if (!text) return undefined;
  const t = text.trim();
  if (!t) return undefined;
  // Difficulty tag on Codeforces is rendered like "*1500" — must be a leading
  // optional asterisk followed by digits, with nothing else.
  const m = /^\*?(\d{3,4})$/.exec(t);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : undefined;
}

function safeText(sel: string, root: ParentNode = document): string | undefined {
  try {
    const el = root.querySelector(sel);
    const t = el?.textContent?.trim();
    return t && t.length > 0 ? t : undefined;
  } catch {
    return undefined;
  }
}

function safeQueryAll(
  sel: string,
  root: ParentNode = document,
): Element[] {
  try {
    return Array.from(root.querySelectorAll(sel));
  } catch {
    return [];
  }
}

export function scrapeProblemMetadata(): ScrapedMetadata {
  const out: ScrapedMetadata = {};

  // Title: the problem statement header is the source of truth.
  const title =
    safeText(".problem-statement .header .title") ??
    (document.title.trim().length > 0 ? document.title.trim() : undefined);
  if (title) out.title = title;

  // Sidebar tags box. Codeforces wraps each tag (and the difficulty) in a
  // span/anchor with the .tag-box class inside #sidebar.
  const tagBoxes = safeQueryAll("#sidebar .tag-box");
  const officialTags: string[] = [];
  let rating: number | undefined;

  for (const el of tagBoxes) {
    const text = el.textContent?.trim();
    if (!text) continue;
    const r = parseRating(text);
    if (r !== undefined) {
      rating = r;
    } else {
      officialTags.push(text);
    }
  }
  if (rating !== undefined) out.rating = rating;
  if (officialTags.length > 0) out.officialTags = officialTags;

  return out;
}
