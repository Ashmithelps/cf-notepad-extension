import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  manifest: {
    name: "CF Recall",
    description:
      "Codeforces smart notes + spaced repetition. Privacy-first, local-only.",
    permissions: ["storage", "tabs", "alarms"],
    host_permissions: ["https://codeforces.com/*"],
    action: {
      default_title: "CF Recall",
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
