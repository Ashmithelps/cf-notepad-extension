export default defineBackground(() => {
  console.log("[CF Recall] background ready");

  chrome.commands?.onCommand.addListener((command) => {
    if (command !== "toggle-panel") return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs[0]?.id;
      if (!id) return;
      chrome.tabs.sendMessage(id, { type: "toggle-panel" }).catch(() => {
        // tab is not a CF problem page — silently ignore
      });
    });
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || typeof msg !== "object") return false;
    if (msg.type === "open-dashboard") {
      const tag: string | undefined =
        typeof msg.tag === "string" ? msg.tag : undefined;
      if (tag) {
        chrome.tabs.create({
          url: chrome.runtime.getURL(
            `options.html?tag=${encodeURIComponent(tag)}`,
          ),
        });
      } else {
        chrome.runtime.openOptionsPage();
      }
      sendResponse({ ok: true });
      return true;
    }
    return false;
  });
});
