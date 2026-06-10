/**
 * Convert a markdown string into a rough plain-text approximation, suitable
 * for the banner peek. This is not a full parser — it strips the common
 * inline/block syntax so the preview reads cleanly:
 *  - fenced code blocks → just their inner contents (no triple backticks)
 *  - inline `code` → its contents (no backticks)
 *  - **bold**, *em*, _em_, __bold__ → contents
 *  - leading #, >, list bullets/numbers → removed
 *  - [text](url) → text; ![alt](url) → alt
 *  - any HTML tags → stripped
 *  - collapses runs of blank lines into a single blank line
 */
export function stripMarkdown(input: string): string {
  let s = input;

  // Fenced code blocks: ```lang\n...\n``` → keep inner content
  s = s.replace(/```[^\n]*\n?([\s\S]*?)\n?```/g, "$1");

  // Inline code: `x` → x
  s = s.replace(/`([^`]+)`/g, "$1");

  // Images: ![alt](url) → alt
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Links: [text](url) → text
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Bold/italic markers around content (run twice to handle ***x***)
  for (let i = 0; i < 2; i += 1) {
    s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
    s = s.replace(/__([^_]+)__/g, "$1");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2");
    s = s.replace(/(^|[^_])_([^_\n]+)_/g, "$1$2");
  }

  // Headings, blockquote markers, list markers at line starts
  s = s.replace(/^[ \t]*#{1,6}[ \t]+/gm, "");
  s = s.replace(/^[ \t]*>[ \t]?/gm, "");
  s = s.replace(/^[ \t]*[-*+][ \t]+/gm, "");
  s = s.replace(/^[ \t]*\d+\.[ \t]+/gm, "");

  // HTML tags
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, "");

  // Collapse 3+ newlines into 2
  s = s.replace(/\n{3,}/g, "\n\n");

  return s;
}
