import { useEffect, useRef, useState } from "react";
import { db, notesRepo } from "../../db";
import {
  buildEnvelope,
  envelopeFilename,
  mergeNotes,
  validateEnvelope,
} from "../../db/transfer";
import {
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  setAppSettings,
  type AppSettings,
  type Theme,
} from "../../settings/local";

type Status =
  | { kind: "idle" }
  | { kind: "ok"; msg: string }
  | { kind: "err"; msg: string };

export function SettingsPanel() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getAppSettings().then(setSettings);
  }, []);

  const patch = async (p: Partial<AppSettings>) => {
    setSettings(await setAppSettings(p));
  };

  const doExport = async () => {
    try {
      const notes = await notesRepo.list();
      const env = buildEnvelope(notes);
      const blob = new Blob([JSON.stringify(env, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = envelopeFilename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus({ kind: "ok", msg: `Exported ${notes.length} note(s).` });
    } catch (err) {
      setStatus({
        kind: "err",
        msg: `Export failed: ${(err as Error).message}`,
      });
    }
  };

  const doImport = async (file: File) => {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const env = validateEnvelope(raw);

      const local = await notesRepo.list();
      const report = mergeNotes(local, env.notes);

      // Atomic: a single transaction. If anything inside throws, nothing
      // gets written — Dexie rolls back the transaction.
      await db.transaction("rw", db.notes, async () => {
        await db.notes.bulkPut(report.result);
      });

      setStatus({
        kind: "ok",
        msg: `Imported: ${report.added} added, ${report.updated} updated, ${report.skipped} skipped.`,
      });
    } catch (err) {
      setStatus({
        kind: "err",
        msg: `Import failed: ${(err as Error).message}. Nothing was written.`,
      });
    }
  };

  return (
    <section className="settings">
      <h2>Settings</h2>

      <div className="settingRow">
        <label>
          Theme
          <select
            className="select"
            value={settings.theme}
            onChange={(e) => void patch({ theme: e.target.value as Theme })}
          >
            <option value="auto">Auto (match the page)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>

      <div className="settingRow">
        <label className="checkLabel">
          <input
            type="checkbox"
            checked={settings.bannerEnabled}
            onChange={(e) => void patch({ bannerEnabled: e.target.checked })}
          />
          <span>Show the revisit banner on problems with notes</span>
        </label>
      </div>

      <h3 style={{ marginTop: 20 }}>Backup</h3>
      <div className="settingRow" style={{ display: "flex", gap: 8 }}>
        <button className="primaryBtn" onClick={() => void doExport()}>
          Export JSON
        </button>
        <button
          className="primaryBtn secondary"
          onClick={() => fileRef.current?.click()}
        >
          Import JSON…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) void doImport(f);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {status.kind !== "idle" && (
        <div
          className={status.kind === "ok" ? "statusOk" : "statusErr"}
          role="status"
        >
          {status.msg}
        </div>
      )}
    </section>
  );
}
