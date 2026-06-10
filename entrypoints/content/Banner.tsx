import { useState } from "react";
import { previewBody } from "../../ui/banner-logic";
import { stripMarkdown } from "../../ui/strip-markdown";
import type { Palette } from "../../ui/theme";
import type { Note } from "../../db/types";

interface Props {
  note: Note;
  palette: Palette;
  onOpenPanel: () => void;
  onDismiss: () => void;
}

function makeStyles(p: Palette) {
  return {
    collapsed: {
      background: p.surface,
      color: p.fg,
      border: `1px solid ${p.border}`,
      borderRadius: "10px",
      boxShadow: p.shadow,
      fontSize: "12px",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 8px 6px 10px",
      width: "fit-content",
    } as React.CSSProperties,
    expanded: {
      background: p.surface,
      color: p.fg,
      border: `1px solid ${p.border}`,
      borderRadius: "10px",
      boxShadow: p.shadow,
      width: "320px",
      fontSize: "12px",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      overflow: "hidden",
    } as React.CSSProperties,
    headerRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 10px",
      borderBottom: `1px solid ${p.border}`,
    } as React.CSSProperties,
    textBtn: {
      background: "transparent",
      color: "inherit",
      border: "none",
      cursor: "pointer",
      padding: 0,
      font: "inherit",
      textAlign: "left" as const,
    },
    dismissBtn: {
      background: "transparent",
      color: p.fgMuted,
      border: "none",
      cursor: "pointer",
      padding: "0 2px",
      fontSize: "14px",
      lineHeight: "1",
    } as React.CSSProperties,
    preview: {
      padding: "10px",
      whiteSpace: "pre-wrap" as const,
      wordBreak: "break-word" as const,
      lineHeight: "1.45",
      maxHeight: "160px",
      overflow: "auto",
    } as React.CSSProperties,
    footer: {
      padding: "8px 10px",
      borderTop: `1px solid ${p.border}`,
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
    } as React.CSSProperties,
    openBtn: {
      background: p.accent,
      color: p.accentFg,
      border: "none",
      borderRadius: "6px",
      padding: "4px 10px",
      fontSize: "12px",
      cursor: "pointer",
    } as React.CSSProperties,
    empty: { opacity: 0.6, fontStyle: "italic" as const },
  };
}

export function Banner({ note, palette, onOpenPanel, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);
  const preview = previewBody(stripMarkdown(note.body), 200);
  const styles = makeStyles(palette);

  if (!expanded) {
    return (
      <div style={styles.collapsed}>
        <button
          style={styles.textBtn}
          onClick={() => setExpanded(true)}
          title="Peek at your notes"
        >
          📝 You have notes on this problem
        </button>
        <button
          style={styles.dismissBtn}
          onClick={onDismiss}
          title="Dismiss for this session"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div style={styles.expanded}>
      <div style={styles.headerRow}>
        <button
          style={styles.textBtn}
          onClick={() => setExpanded(false)}
          title="Collapse"
        >
          📝 Your notes (preview)
        </button>
        <button
          style={styles.dismissBtn}
          onClick={onDismiss}
          title="Dismiss for this session"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div style={styles.preview}>
        {preview.length > 0 ? preview : <span style={styles.empty}>(empty)</span>}
      </div>
      <div style={styles.footer}>
        <button style={styles.openBtn} onClick={onOpenPanel}>
          Open notes
        </button>
      </div>
    </div>
  );
}
