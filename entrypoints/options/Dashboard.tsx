import { useEffect, useMemo, useState } from "react";
import { notesRepo } from "../../db";
import { getAppSettings, type Theme } from "../../settings/local";
import type { Note, Platform } from "../../db/types";
import {
  applyFilters,
  sortNotes,
  type Filters,
  type SortDir,
  type SortKey,
} from "../../ui/dashboard-filters";
import { SettingsPanel } from "./SettingsPanel";

function useUrlTag(): [string | undefined, (t: string | undefined) => void] {
  const [tag, setTagState] = useState<string | undefined>(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("tag") ?? undefined;
  });
  const setTag = (t: string | undefined) => {
    const url = new URL(window.location.href);
    if (t) url.searchParams.set("tag", t);
    else url.searchParams.delete("tag");
    window.history.replaceState({}, "", url.toString());
    setTagState(t);
  };
  return [tag, setTag];
}

type Tab = "notes" | "settings";

function useUrlTab(): [Tab, (t: Tab) => void] {
  const [tab, setTabState] = useState<Tab>(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("view") === "settings" ? "settings" : "notes";
  });
  const setTab = (t: Tab) => {
    const url = new URL(window.location.href);
    if (t === "settings") url.searchParams.set("view", "settings");
    else url.searchParams.delete("view");
    window.history.replaceState({}, "", url.toString());
    setTabState(t);
  };
  return [tab, setTab];
}

export function Dashboard() {
  const [tab, setTab] = useUrlTab();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useUrlTag();
  const [platform, setPlatform] = useState<Platform | "">("");
  const [ratingMin, setRatingMin] = useState<string>("");
  const [ratingMax, setRatingMax] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [all, tags, settings] = await Promise.all([
        notesRepo.list(),
        notesRepo.distinctTechniqueTags(),
        getAppSettings(),
      ]);
      if (cancelled) return;
      setNotes(all);
      setAllTags(tags);
      applyThemeAttribute(settings.theme);
    })();
    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: chrome.storage.AreaName,
    ) => {
      if (area === "local" && changes["settings"]) {
        void getAppSettings().then((s) => applyThemeAttribute(s.theme));
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(onChange);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!notes) return [];
    const f: Filters = {
      query,
      techniqueTag: tagFilter,
      platform: platform === "" ? undefined : platform,
      ratingMin: ratingMin === "" ? undefined : Number(ratingMin),
      ratingMax: ratingMax === "" ? undefined : Number(ratingMax),
    };
    return sortNotes(applyFilters(notes, f), sortKey, sortDir);
  }, [notes, query, tagFilter, platform, ratingMin, ratingMax, sortKey, sortDir]);

  return (
    <main className="app">
      <div style={{ display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
        <h1>CF Recall</h1>
        <a
          href={chrome.runtime.getURL("review.html")}
          style={{ color: "var(--accent)" }}
        >
          → Review queue
        </a>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            className={tab === "notes" ? "tab tab-active" : "tab"}
            onClick={() => setTab("notes")}
          >
            Notes
          </button>
          <button
            className={tab === "settings" ? "tab tab-active" : "tab"}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
        </div>
      </div>
      {tab === "notes" && (
        <div className="muted">
          {notes ? `${notes.length} notes total` : "Loading…"}
        </div>
      )}
      {tab === "settings" && <SettingsPanel />}
      {tab === "notes" && (<>
      <div className="controls">
        <input
          className="input"
          placeholder="Search title or body…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="select"
          value={tagFilter ?? ""}
          onChange={(e) => setTagFilter(e.target.value || undefined)}
        >
          <option value="">All techniques</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform | "")}
        >
          <option value="">All platforms</option>
          <option value="cf">Codeforces</option>
        </select>
        <input
          className="input"
          type="number"
          placeholder="rating ≥"
          value={ratingMin}
          onChange={(e) => setRatingMin(e.target.value)}
        />
        <input
          className="input"
          type="number"
          placeholder="rating ≤"
          value={ratingMax}
          onChange={(e) => setRatingMax(e.target.value)}
        />
      </div>

      <div className="controls" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
        <select
          className="select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="updatedAt">Sort: last updated</option>
          <option value="rating">Sort: rating</option>
        </select>
        <select
          className="select"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value as SortDir)}
        >
          <option value="desc">↓ desc</option>
          <option value="asc">↑ asc</option>
        </select>
        {tagFilter && (
          <span className="activeFilter">
            technique: {tagFilter}
            <button
              aria-label="Clear tag filter"
              onClick={() => setTagFilter(undefined)}
            >
              ×
            </button>
          </span>
        )}
      </div>

      {notes && filtered.length === 0 && (
        <div className="empty">No notes match these filters.</div>
      )}

      {filtered.map((n) => (
        <div key={n.key} className="row">
          <div className="left">
            <div className="titleLine">
              <a href={n.url} target="_blank" rel="noreferrer">
                {n.title ?? n.key}
              </a>
            </div>
            <div className="meta">
              <span style={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
                {n.key}
              </span>
              {n.rating !== undefined && <span>★ {n.rating}</span>}
              <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
              {n.techniqueTags.length > 0 && (
                <span className="tagRow">
                  {n.techniqueTags.map((t) => (
                    <button
                      key={t}
                      className="tagChip"
                      onClick={() => setTagFilter(t)}
                      title={`Filter by ${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </span>
              )}
              {n.officialTags && n.officialTags.length > 0 && (
                <span className="tagRow">
                  {n.officialTags.map((t) => (
                    <span key={t} className="officialChip">
                      {t}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      </>)}
    </main>
  );
}

function applyThemeAttribute(theme: Theme) {
  const html = document.documentElement;
  if (theme === "auto") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", theme);
}
