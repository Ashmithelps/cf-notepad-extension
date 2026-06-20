import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  manifest: {
    name: "CF Recall",
    description:
      "Codeforces smart notes + spaced repetition. Privacy-first, local-only.",
    permissions: ["storage", "tabs"],
    host_permissions: ["https://codeforces.com/*"],
    icons: {
      16: "icon-16.png",
      32: "icon-32.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
    action: {
      default_title: "CF Recall",
      default_icon: {
        16: "icon-16.png",
        32: "icon-32.png",
        48: "icon-48.png",
        128: "icon-128.png",
      },
    },
    commands: {
      "toggle-panel": {
        suggested_key: { default: "Alt+Shift+N" },
        description: "Toggle CF Recall side panel on a problem page",
      },
    },
    browser_specific_settings: {
      gecko: {
        id: "cf-recall@local",
        strict_min_version: "115.0",
      },
    },
  },
});
