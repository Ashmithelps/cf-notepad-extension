import type { Config } from "tailwindcss";

export default {
  content: [
    "./entrypoints/**/*.{ts,tsx,html}",
    "./ui/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
