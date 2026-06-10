import type { Theme } from "../settings/local";

export type ResolvedTheme = "light" | "dark";

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  fg: string;
  fgMuted: string;
  border: string;
  accent: string;
  accentFg: string;
  danger: string;
  dangerFg: string;
  chipBg: string;
  chipFg: string;
  officialBg: string;
  officialFg: string;
  codeBg: string;
  codeFg: string;
  shadow: string;
}

export const DARK_PALETTE: Palette = {
  bg: "#0b1220",
  surface: "#111827",
  surfaceAlt: "#0b1220",
  fg: "#f9fafb",
  fgMuted: "#9ca3af",
  border: "#374151",
  accent: "#2563eb",
  accentFg: "#ffffff",
  danger: "#b91c1c",
  dangerFg: "#ffffff",
  chipBg: "#1e1b4b",
  chipFg: "#c7d2fe",
  officialBg: "#064e3b",
  officialFg: "#a7f3d0",
  codeBg: "#0b1220",
  codeFg: "#e5e7eb",
  shadow: "0 12px 32px rgba(0,0,0,0.35)",
};

export const LIGHT_PALETTE: Palette = {
  bg: "#ffffff",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  fg: "#0f172a",
  fgMuted: "#475569",
  border: "#e2e8f0",
  accent: "#2563eb",
  accentFg: "#ffffff",
  danger: "#b91c1c",
  dangerFg: "#ffffff",
  chipBg: "#eef2ff",
  chipFg: "#3730a3",
  officialBg: "#ecfdf5",
  officialFg: "#065f46",
  // keep code blocks dark in both modes — github-dark stylesheet stays readable
  codeBg: "#0b1220",
  codeFg: "#e5e7eb",
  shadow: "0 12px 32px rgba(15,23,42,0.18)",
};

export function paletteFor(resolved: ResolvedTheme): Palette {
  return resolved === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

/** Pure helper: how to interpret the user's setting given an environment signal. */
export function resolveTheme(
  setting: Theme,
  envIsDark: boolean,
): ResolvedTheme {
  if (setting === "light") return "light";
  if (setting === "dark") return "dark";
  return envIsDark ? "dark" : "light";
}

export function detectEnvIsDark(): boolean {
  try {
    // Some CF user-styles toggle this class on <body>.
    if (document.body.classList.contains("cf-dark-mode")) return true;
    if (document.documentElement.classList.contains("dark")) return true;
    return (
      window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
    );
  } catch {
    return false;
  }
}
