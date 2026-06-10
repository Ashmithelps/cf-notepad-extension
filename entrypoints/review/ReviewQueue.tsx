import { useEffect, useState } from "react";
import { notesRepo } from "../../db";
import { getAppSettings, type Theme } from "../../settings/local";
import { dueQueue } from "../../srs/queue";
import { formatInterval, GRADES, normalizeStored, type Grade } from "../../srs/schedule";
import type { Note } from "../../db/types";

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  if (theme === "auto") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", theme);
}

export function ReviewQueue() {
  const [allNotes, setAllNotes] = useState<Note[] | null>(null);
  const [now, setNow] = useState(Date.now());

  const reload = async () => {
    const ns = await notesRepo.list();
    setAllNotes(ns);
    setNow(Date.now());
  };

  useEffect(() => {
    void reload();
    void getAppSettings().then((s) => applyTheme(s.theme));
    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: chrome.storage.AreaName,
    ) => {
      if (area === "local" && changes["settings"]) {
        void getAppSettings().then((s) => applyTheme(s.theme));
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const due = allNotes ? dueQueue(allNotes, now) : [];

  const rate = async (note: Note, grade: Grade) => {
    const updated = await notesRepo.rate(note.key, grade);
    if (!updated || !allNotes) return;
    setAllNotes(allNotes.map((n) => (n.key === updated.key ? updated : n)));
    setNow(Date.now());
    try {
      chrome.runtime.sendMessage({ type: "review-changed" });
    } catch {
      /* noop */
    }
  };

  return (
    <main className="app">
      <h1>Review</h1>
      <div className="muted">
        {allNotes === null
          ? "Loading…"
          : due.length === 0
            ? "All caught up."
            : `${due.length} problem${due.length === 1 ? "" : "s"} due`}
      </div>

      {allNotes !== null && due.length === 0 && (
        <div className="empty">🎉 Nothing due right now.</div>
      )}

      {due.map((n) => {
        const card = normalizeStored(n.srs);
        const overdueText = card ? formatInterval(card.due, now) : "";
        return (
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
                <span>overdue {overdueText}</span>
                {n.techniqueTags.length > 0 && (
                  <span className="tagRow">
                    {n.techniqueTags.map((t) => (
                      <span key={t} className="tagChip">
                        {t}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                {GRADES.map((g) => (
                  <button
                    key={g}
                    className="select"
                    style={{ flex: "0 0 auto", cursor: "pointer" }}
                    onClick={() => void rate(n, g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </main>
  );
}
