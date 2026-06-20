import { useEffect, useMemo, useState } from "react";
import { notesRepo } from "../../db";
import { scrapeProblemMetadata } from "../../parser/cf-dom";
import { MarkdownView } from "../../ui/MarkdownView";
import { normalizeTag, normalizeTagList } from "../../ui/tags";
import type { Palette } from "../../ui/theme";
import type { Note, ProblemKey } from "../../db/types";

type Mode =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "view"; note: Note }
  | { kind: "create"; draft: string }
  | { kind: "edit"; note: Note; draft: string }
  | { kind: "confirmDelete"; note: Note };

interface Props {
  pkey: ProblemKey;
  url: string;
  title?: string;
  open: boolean;
  palette: Palette;
  onOpen: () => void;
  onClose: () => void;
  reloadToken?: number;
}

type Styles = ReturnType<typeof makeStyles>;

function makeStyles(p: Palette) {
  return {
    toggle: {
      background: p.surface,
      color: p.fg,
      border: `1px solid ${p.border}`,
      borderRadius: "999px",
      padding: "8px 12px",
      fontSize: "12px",
      cursor: "pointer",
      boxShadow: p.shadow,
    } as React.CSSProperties,
    panel: {
      width: "380px",
      maxHeight: "75vh",
      display: "flex",
      flexDirection: "column",
      background: p.surface,
      border: `1px solid ${p.border}`,
      borderRadius: "12px",
      boxShadow: p.shadow,
      overflow: "hidden",
      color: p.fg,
    } as React.CSSProperties,
    header: {
      padding: "10px 12px",
      borderBottom: `1px solid ${p.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
    } as React.CSSProperties,
    headerTitle: { fontSize: "12px", lineHeight: "1.3", minWidth: 0 } as React.CSSProperties,
    key: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: "11px",
      opacity: 0.7,
    } as React.CSSProperties,
    headerActions: { display: "flex", gap: "6px" } as React.CSSProperties,
    iconBtn: {
      background: "transparent",
      color: p.fg,
      border: `1px solid ${p.border}`,
      borderRadius: "6px",
      padding: "2px 8px",
      fontSize: "12px",
      cursor: "pointer",
    } as React.CSSProperties,
    body: {
      padding: "12px",
      overflow: "auto",
      fontSize: "13px",
      lineHeight: "1.45",
      flex: 1,
    } as React.CSSProperties,
    empty: {
      padding: "16px 12px",
      fontSize: "13px",
      textAlign: "center" as const,
      opacity: 0.85,
    },
    textarea: {
      width: "100%",
      minHeight: "200px",
      boxSizing: "border-box" as const,
      background: p.surfaceAlt,
      color: p.fg,
      border: `1px solid ${p.border}`,
      borderRadius: "8px",
      padding: "10px",
      fontSize: "13px",
      lineHeight: "1.45",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      resize: "vertical" as const,
    },
    tagInput: {
      width: "100%",
      boxSizing: "border-box" as const,
      background: p.surfaceAlt,
      color: p.fg,
      border: `1px solid ${p.border}`,
      borderRadius: "6px",
      padding: "6px 8px",
      fontSize: "12px",
    },
    footer: {
      padding: "8px 12px",
      borderTop: `1px solid ${p.border}`,
      display: "flex",
      gap: "8px",
      justifyContent: "flex-end",
    } as React.CSSProperties,
    primaryBtn: {
      background: p.accent,
      color: p.accentFg,
      border: "none",
      borderRadius: "6px",
      padding: "6px 12px",
      fontSize: "12px",
      cursor: "pointer",
    } as React.CSSProperties,
    dangerBtn: {
      background: p.danger,
      color: p.dangerFg,
      border: "none",
      borderRadius: "6px",
      padding: "6px 12px",
      fontSize: "12px",
      cursor: "pointer",
    } as React.CSSProperties,
    section: {
      margin: "10px 0",
      padding: "8px 10px",
      background: p.surfaceAlt,
      border: `1px solid ${p.border}`,
      borderRadius: "8px",
    } as React.CSSProperties,
    sectionLabel: {
      fontSize: "11px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      opacity: 0.7,
      marginBottom: "6px",
    },
    chipRow: { display: "flex", flexWrap: "wrap" as const, gap: "4px" },
    techniqueChip: {
      background: p.chipBg,
      color: p.chipFg,
      border: "none",
      padding: "2px 8px 2px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
    } as React.CSSProperties,
    removeBtn: {
      background: "transparent",
      border: "none",
      color: "inherit",
      cursor: "pointer",
      fontSize: "13px",
      padding: 0,
      lineHeight: 1,
    } as React.CSSProperties,
    officialChip: {
      background: p.officialBg,
      color: p.officialFg,
      padding: "2px 8px",
      borderRadius: "999px",
      fontSize: "11px",
    } as React.CSSProperties,
  };
}

function openDashboard(tag?: string) {
  chrome.runtime.sendMessage({ type: "open-dashboard", tag });
}

export function Panel({
  pkey,
  url,
  title,
  open,
  palette,
  onOpen,
  onClose,
  reloadToken,
}: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [mode, setMode] = useState<Mode>({ kind: "loading" });
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const n = await notesRepo.get(pkey.key);
      if (cancelled) return;
      if (n) {
        // Backfill any missing metadata from the page, never overwriting.
        const meta = scrapeProblemMetadata();
        const backfilled = await notesRepo.backfillMetadata(pkey.key, meta);
        if (cancelled) return;
        setMode({ kind: "view", note: backfilled ?? n });
      } else {
        setMode({ kind: "empty" });
      }
      const tags = await notesRepo.distinctTechniqueTags();
      if (!cancelled) setTagSuggestions(tags);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, pkey.key, reloadToken]);

  if (!open) {
    return (
      <button style={styles.toggle} onClick={onOpen} title="Open CF Recall notes">
        📝 CF Recall · <strong>{pkey.key}</strong>
      </button>
    );
  }

  return (
    <div style={styles.panel}>
      <header style={styles.header}>
        <div style={styles.headerTitle}>
          <div
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title ?? "Problem"}
          </div>
          <div style={styles.key}>{pkey.key}</div>
        </div>
        <div style={styles.headerActions}>
          <button
            style={styles.iconBtn}
            onClick={() => openDashboard()}
            title="Open dashboard"
          >
            ☰
          </button>
          <button style={styles.iconBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>
      </header>
      <PanelBody
        mode={mode}
        setMode={setMode}
        pkey={pkey}
        url={url}
        title={title}
        suggestions={tagSuggestions}
        styles={styles}
      />
    </div>
  );
}

function PanelBody({
  mode,
  setMode,
  pkey,
  url,
  title,
  suggestions,
  styles,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  pkey: ProblemKey;
  url: string;
  title?: string;
  suggestions: string[];
  styles: Styles;
}) {
  if (mode.kind === "loading") return <div style={styles.body}>Loading…</div>;

  if (mode.kind === "empty") {
    return (
      <>
        <div style={styles.empty}>No notes yet for this problem.</div>
        <div style={styles.footer}>
          <button
            style={styles.primaryBtn}
            onClick={() => setMode({ kind: "create", draft: "" })}
          >
            + Add note
          </button>
        </div>
      </>
    );
  }

  if (mode.kind === "view") {
    const note = mode.note;
    return (
      <>
        <div style={styles.body}>
          {note.rating !== undefined && (
            <div style={{ fontSize: "12px", opacity: 0.8, marginBottom: "8px" }}>
              ★ <strong>{note.rating}</strong>
            </div>
          )}
          {note.body.trim().length > 0 ? (
            <MarkdownView body={note.body} />
          ) : (
            <em style={{ opacity: 0.6 }}>(empty)</em>
          )}

          <TechniqueTagsSection
            note={note}
            suggestions={suggestions}
            styles={styles}
            onUpdate={(nextNote) => setMode({ kind: "view", note: nextNote })}
          />
          {note.officialTags && note.officialTags.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Problem tags</div>
              <div style={styles.chipRow}>
                {note.officialTags.map((t) => (
                  <span key={t} style={styles.officialChip}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={styles.footer}>
          <button
            style={styles.dangerBtn}
            onClick={() => setMode({ kind: "confirmDelete", note })}
          >
            Delete
          </button>
          <button
            style={styles.primaryBtn}
            onClick={() => setMode({ kind: "edit", note, draft: note.body })}
          >
            Edit
          </button>
        </div>
      </>
    );
  }

  if (mode.kind === "create") {
    return (
      <>
        <div style={{ ...styles.body, paddingBottom: 0 }}>
          <textarea
            autoFocus
            style={styles.textarea}
            value={mode.draft}
            placeholder="Markdown supported. Fenced code blocks get syntax highlighting."
            onChange={(e) =>
              setMode({ kind: "create", draft: e.currentTarget.value })
            }
          />
        </div>
        <div style={styles.footer}>
          <button style={styles.iconBtn} onClick={() => setMode({ kind: "empty" })}>
            Cancel
          </button>
          <button
            style={styles.primaryBtn}
            onClick={async () => {
              const meta = scrapeProblemMetadata();
              const note = await notesRepo.create(pkey, {
                url,
                title: title ?? meta.title,
                rating: meta.rating,
                officialTags: meta.officialTags,
                body: mode.draft,
              });
              setMode({ kind: "view", note });
            }}
          >
            Save
          </button>
        </div>
      </>
    );
  }

  if (mode.kind === "edit") {
    const note = mode.note;
    return (
      <>
        <div style={{ ...styles.body, paddingBottom: 0 }}>
          <textarea
            autoFocus
            style={styles.textarea}
            value={mode.draft}
            onChange={(e) =>
              setMode({ kind: "edit", note, draft: e.currentTarget.value })
            }
          />
        </div>
        <div style={styles.footer}>
          <button
            style={styles.iconBtn}
            onClick={() => setMode({ kind: "view", note })}
          >
            Cancel
          </button>
          <button
            style={styles.primaryBtn}
            onClick={async () => {
              const updated = await notesRepo.update(note.key, {
                body: mode.draft,
              });
              if (updated) setMode({ kind: "view", note: updated });
            }}
          >
            Save
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={styles.body}>Delete this note? This cannot be undone.</div>
      <div style={styles.footer}>
        <button
          style={styles.iconBtn}
          onClick={() => setMode({ kind: "view", note: mode.note })}
        >
          Cancel
        </button>
        <button
          style={styles.dangerBtn}
          onClick={async () => {
            await notesRepo.delete(mode.note.key);
            setMode({ kind: "empty" });
          }}
        >
          Delete
        </button>
      </div>
    </>
  );
}

function TechniqueTagsSection({
  note,
  suggestions,
  styles,
  onUpdate,
}: {
  note: Note;
  suggestions: string[];
  styles: Styles;
  onUpdate: (n: Note) => void;
}) {
  const [input, setInput] = useState("");
  const listId = useMemo(
    () => `cf-recall-tags-${note.key.replace(/[^a-z0-9]/gi, "_")}`,
    [note.key],
  );

  const addTag = async (raw: string) => {
    const norm = normalizeTag(raw);
    if (!norm) return;
    const next = normalizeTagList([...note.techniqueTags, norm]);
    const updated = await notesRepo.update(note.key, { techniqueTags: next });
    if (updated) onUpdate(updated);
    setInput("");
  };

  const removeTag = async (t: string) => {
    const next = note.techniqueTags.filter((x) => x !== t);
    const updated = await notesRepo.update(note.key, { techniqueTags: next });
    if (updated) onUpdate(updated);
  };

  const remaining = suggestions.filter(
    (s) => !note.techniqueTags.includes(s),
  );

  return (
    <div style={styles.section}>
      <div style={styles.sectionLabel}>My techniques</div>
      {note.techniqueTags.length > 0 ? (
        <div style={{ ...styles.chipRow, marginBottom: "6px" }}>
          {note.techniqueTags.map((t) => (
            <span key={t} style={styles.techniqueChip}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: 0,
                  font: "inherit",
                }}
                onClick={() => openDashboard(t)}
                title={`Open all notes tagged ${t}`}
              >
                {t}
              </button>
              <button
                style={styles.removeBtn}
                onClick={() => removeTag(t)}
                title="Remove"
                aria-label={`Remove ${t}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "6px" }}>
          No techniques yet. Add one to build your pattern library.
        </div>
      )}
      <input
        style={styles.tagInput}
        placeholder="add technique (Enter)"
        value={input}
        list={listId}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void addTag(input);
          }
        }}
      />
      <datalist id={listId}>
        {remaining.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
