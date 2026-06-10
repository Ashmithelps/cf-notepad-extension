import { notesRepo } from "../db";
import { getAppSettings } from "../settings/local";
import { dueQueue } from "../srs/queue";

const ALARM_NAME = "cf-recall-due-tick";
const BADGE_COLOR = "#b91c1c";

async function refreshBadge(): Promise<void> {
  try {
    const settings = await getAppSettings();
    if (!settings.reviewRemindersEnabled) {
      await chrome.action.setBadgeText({ text: "" });
      return;
    }
    const all = await notesRepo.list();
    const count = dueQueue(all, Date.now()).length;
    const text = count > 0 ? String(count) : "";
    await chrome.action.setBadgeText({ text });
    if (text) await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  } catch (err) {
    console.warn("[CF Recall] badge refresh failed", err);
  }
}

export default defineBackground(() => {
  console.log("[CF Recall] background ready");

  refreshBadge();
  try {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 60 });
  } catch (err) {
    console.warn("[CF Recall] alarm create failed", err);
  }

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) void refreshBadge();
  });

  chrome.runtime.onStartup.addListener(() => {
    void refreshBadge();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes["settings"]) void refreshBadge();
  });

  chrome.commands?.onCommand.addListener((command) => {
    if (command !== "toggle-panel") return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const id = tabs[0]?.id;
      if (!id) return;
      chrome.tabs.sendMessage(id, { type: "toggle-panel" }).catch(() => {
        // tab is probably not a CF problem page — silently ignore.
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
    if (msg.type === "review-changed") {
      void refreshBadge();
      sendResponse({ ok: true });
      return true;
    }
    return false;
  });
});
