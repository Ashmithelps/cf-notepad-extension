import { useEffect, useMemo, useState } from "react";
import { notesRepo } from "../../db";
import { getAppSettings } from "../../settings/local";
import { shouldShowBanner } from "../../ui/banner-logic";
import {
  detectEnvIsDark,
  paletteFor,
  resolveTheme,
  type ResolvedTheme,
} from "../../ui/theme";
import type { Note, ProblemKey } from "../../db/types";
import { Banner } from "./Banner";
import { Panel } from "./Panel";

interface Props {
  pkey: ProblemKey;
  url: string;
  title?: string;
}

const shellStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "16px",
  right: "16px",
  zIndex: 2147483647,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "8px",
  pointerEvents: "auto",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

export function ContentApp({ pkey, url, title }: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [bannerEnabled, setBannerEnabled] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme("auto", detectEnvIsDark()),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [n, settings] = await Promise.all([
        notesRepo.get(pkey.key),
        getAppSettings(),
      ]);
      if (cancelled) return;
      setNote(n);
      setBannerEnabled(settings.bannerEnabled);
      setResolved(resolveTheme(settings.theme, detectEnvIsDark()));
    })();
    return () => {
      cancelled = true;
    };
  }, [pkey.key, reloadToken]);

  // Toolbar keyboard shortcut → toggle panel.
  useEffect(() => {
    const listener = (msg: unknown) => {
      if (
        msg &&
        typeof msg === "object" &&
        (msg as { type?: string }).type === "toggle-panel"
      ) {
        setPanelOpen((o) => !o);
        if (!panelOpen) setDismissed(true);
      }
      return false;
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [panelOpen]);

  // React to settings changes from the options page without a reload.
  useEffect(() => {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: chrome.storage.AreaName,
    ) => {
      if (area !== "local" || !changes["settings"]) return;
      void (async () => {
        const s = await getAppSettings();
        setBannerEnabled(s.bannerEnabled);
        setResolved(resolveTheme(s.theme, detectEnvIsDark()));
      })();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const handleClose = () => {
    setPanelOpen(false);
    setReloadToken((t) => t + 1);
  };

  const palette = useMemo(() => paletteFor(resolved), [resolved]);

  const showBanner =
    note !== null &&
    shouldShowBanner({
      noteExists: true,
      dismissedThisSession: dismissed,
      bannerEnabled,
      panelOpen,
    });

  return (
    <div style={shellStyle}>
      {showBanner && note && (
        <Banner
          note={note}
          palette={palette}
          onOpenPanel={() => {
            setDismissed(true);
            setPanelOpen(true);
          }}
          onDismiss={() => setDismissed(true)}
        />
      )}
      <Panel
        pkey={pkey}
        url={url}
        title={title}
        open={panelOpen}
        palette={palette}
        onOpen={() => setPanelOpen(true)}
        onClose={handleClose}
        reloadToken={reloadToken}
      />
    </div>
  );
}
