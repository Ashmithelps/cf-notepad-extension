function openExt(path: string) {
  chrome.tabs.create({ url: chrome.runtime.getURL(path) });
}

export function Popup() {
  return (
    <main className="popup">
      <h1>CF Recall</h1>
      <p className="muted">Smart notes &amp; spaced repetition for Codeforces.</p>
      <button className="primary" onClick={() => openExt("review.html")}>
        Review queue
      </button>
      <button
        className="primary secondary"
        onClick={() => chrome.runtime.openOptionsPage()}
      >
        Dashboard
      </button>
    </main>
  );
}
