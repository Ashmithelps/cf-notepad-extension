# CF Recall

A privacy-first Codeforces companion that turns the site into a personal learning system. Attach markdown notes to any problem, get a gentle reminder when you revisit one you've solved before, and tag problems by technique to build a personal pattern library. All data lives in your browser — no servers, no accounts.

## Features

- **Notes per problem** — one markdown note per problem, with syntax-highlighted code blocks, rendered inside an isolated Shadow DOM so it never clashes with Codeforces' own styles.
- **Revisit banner** — a small dismissible chip appears when you reopen a problem you already have notes on, so you always know you've been here before.
- **Technique tags / pattern library** — tag a note `binary-search-on-answer` or `dp-bitmask`. Click any tag to instantly filter your entire Dashboard to every problem you've attacked with that idea. Autocompletes from your own history.
- **Auto-scraped metadata** — title, difficulty rating, and official problem tags are pulled from the page on first save and backfilled later, never overwriting your data.
- **Dashboard** — search across title and body text, filter by technique tag, rating range, or platform, and sort by recency or rating.
- **Export / import** — local JSON backup with merge-by-`updatedAt` semantics. Malformed files leave your database untouched.
- **Theme + keyboard shortcut** — auto / light / dark theme, plus `Alt+Shift+N` to toggle the panel from any Codeforces problem page (rebindable via `chrome://extensions/shortcuts`).

## Privacy

Everything is stored locally in your browser's IndexedDB via Dexie.js. There are no servers, no analytics, no telemetry, and no accounts. The only outbound request is an optional fetch to the Codeforces public API to backfill problem metadata — it sends only a problem ID and no personal data. Export / import is the only way data leaves your browser.

---

## Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

### 1. Clone the repository

```bash
git clone https://github.com/Ashmithelps/cf-notepad-extension.git
cd cf-notepad-extension
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the extension

```bash
npm run build
```

This produces the ready-to-load extension in `.output/chrome-mv3/`.

> **Note:** `.output/` is a hidden folder on macOS. In Finder press **Cmd + Shift + .** to reveal hidden files. Alternatively, copy the build to a visible location:
> ```bash
> cp -r .output/chrome-mv3 ~/Desktop/cf-recall-ext
> ```

### 4. Load in Chrome / Edge / Brave

1. Open `chrome://extensions` in your browser
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `.output/chrome-mv3/` folder (or `~/Desktop/cf-recall-ext` if you copied it)

The CF Recall icon appears in your toolbar. Navigate to any Codeforces problem to start using it.

### 5. Load in Firefox

```bash
npm run build:firefox
```

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `.output/firefox-mv2/manifest.json`

---

## Development

```bash
npm run dev          # start dev server with hot-reload (Chrome)
npm run dev:firefox  # start dev server with hot-reload (Firefox)
npm test             # run the test suite (vitest)
npm run compile      # TypeScript type-check only
npm run icons        # regenerate PNG icons from public/icon.svg
```

After making code changes in dev mode, Chrome reloads the extension automatically. For a clean production build, use `npm run build` and refresh the extension in `chrome://extensions`.

---

## How to use

### Taking notes on a problem

1. Open any Codeforces problem (e.g. `codeforces.com/problemset/problem/1850/A`)
2. A **📝 CF Recall** button appears at the top of the page — click it to open the panel
3. Click **+ Add note** and write in Markdown. Fenced code blocks get syntax highlighting
4. Press **Save** — your note is stored immediately in your browser

### Tagging techniques

In the panel's **My techniques** section, type a technique name (e.g. `two-pointers`) and press Enter. Tags are normalised to lowercase-kebab-case. Click any tag in the panel or Dashboard to filter all notes by that technique.

### Dashboard

Click the CF Recall toolbar icon → **Open Dashboard** (or press `Alt+Shift+N` on a problem page and use the ☰ menu button). The Dashboard lets you:

- Search notes by title or body text
- Filter by technique tag, platform, or difficulty rating range
- Sort by last updated or rating
- Export all notes to JSON / import from a backup

### Keyboard shortcut

`Alt+Shift+N` toggles the panel on any Codeforces problem page. To change the shortcut: `chrome://extensions/shortcuts`.

---

## Architecture

```
parser/          URL → ProblemKey · DOM scraper for title/rating/tags
db/              Dexie schema · NotesRepo (CRUD) · export/import merge
ui/              theme · banner logic · markdown renderer · filters · tags
settings/        chrome.storage.local adapter
entrypoints/
  background.ts  keyboard shortcut · message routing
  content/       Shadow-DOM React mount · Panel · Banner
  popup/         toolbar popup → Dashboard
  options/       Dashboard + Settings page
public/          extension icons (SVG master + rasterised PNGs)
scripts/         build-icons.js — SVG → PNG rasteriser (uses sharp)
```

The content script lives entirely inside a Shadow DOM, so Codeforces' CSS cannot leak into the panel and the panel's styles cannot affect the page.

## License

MIT
