export function extractProblemTitle(): string | undefined {
  const heading = document.querySelector<HTMLElement>(
    ".problem-statement .header .title",
  );
  const t = heading?.textContent?.trim();
  if (t) return t;
  const docTitle = document.title.trim();
  return docTitle.length > 0 ? docTitle : undefined;
}
