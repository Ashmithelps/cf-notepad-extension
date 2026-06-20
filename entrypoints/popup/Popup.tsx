function openExt(path: string) {
  chrome.tabs.create({ url: chrome.runtime.getURL(path) });
}

export function Popup() {
  return (
    <main className="popup">
      <h1>CF Recall</h1>
      <p className="muted">Smart notes for Codeforces. Privacy-first, local-only.</p>
      <button className="primary" onClick={() => chrome.runtime.openOptionsPage()}>
        Open Dashboard
      </button>
    </main>
  );
}
