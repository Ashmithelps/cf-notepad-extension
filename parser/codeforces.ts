import type { ProblemKey } from "../db/types";

const CF_HOSTS = new Set(["codeforces.com", "www.codeforces.com"]);

const PATTERNS: RegExp[] = [
  /^\/problemset\/problem\/(?<contestId>\d+)\/(?<index>[A-Za-z][A-Za-z0-9]*)\/?$/,
  /^\/contest\/(?<contestId>\d+)\/problem\/(?<index>[A-Za-z][A-Za-z0-9]*)\/?$/,
  /^\/gym\/(?<contestId>\d+)\/problem\/(?<index>[A-Za-z0-9][A-Za-z0-9]*)\/?$/,
  /^\/group\/[^/]+\/contest\/(?<contestId>\d+)\/problem\/(?<index>[A-Za-z][A-Za-z0-9]*)\/?$/,
];

export function parseProblemKey(input: string): ProblemKey | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (!CF_HOSTS.has(url.hostname)) return null;

  const path = url.pathname;
  for (const re of PATTERNS) {
    const m = re.exec(path);
    if (!m?.groups) continue;
    const contestId = m.groups["contestId"];
    const rawIndex = m.groups["index"];
    if (!contestId || !rawIndex) continue;
    const index = rawIndex.toUpperCase();
    return {
      platform: "cf",
      contestId,
      index,
      key: `cf:${contestId}${index}`,
    };
  }
  return null;
}
