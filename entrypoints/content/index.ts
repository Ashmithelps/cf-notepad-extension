import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { parseProblemKey } from "../../parser/codeforces";
import { ContentApp } from "./ContentApp";
import { extractProblemTitle } from "./page-meta";
// CSS imported as raw strings so we can attach them INSIDE the shadow root
// rather than letting them leak into the host page.
import hljsTheme from "highlight.js/styles/github-dark.css?inline";
import mdStyles from "../../ui/markdown.css?inline";

export default defineContentScript({
  matches: ["https://codeforces.com/*"],
  cssInjectionMode: "ui",
  runAt: "document_idle",
  async main(ctx) {
    const pkey = parseProblemKey(location.href);
    if (!pkey) return;

    const title = extractProblemTitle();
    console.log("[CF Recall] mounting panel for", pkey.key);

    let root: Root | null = null;
    const ui = await createShadowRootUi(ctx, {
      name: "cf-recall-root",
      position: "inline",
      anchor: "body",
      onMount: (container) => {
        const style = document.createElement("style");
        style.textContent = `${hljsTheme as string}\n${mdStyles as string}`;
        container.appendChild(style);
        const host = document.createElement("div");
        container.appendChild(host);
        root = createRoot(host);
        root.render(
          createElement(
            StrictMode,
            null,
            createElement(ContentApp, { pkey, url: location.href, title }),
          ),
        );
        return root;
      },
      onRemove: () => {
        root?.unmount();
        root = null;
      },
    });
    ui.mount();
  },
});
