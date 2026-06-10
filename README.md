# CF Recall

A privacy-first Codeforces companion that turns the site into a personal
learning system. Attach markdown notes to any problem, get a gentle reminder
when you revisit one you've solved before, tag problems by technique to build a
personal pattern library, and review old solutions on an FSRS-based
spaced-repetition schedule. All data lives on your machine.

> _<!-- demo gif → docs/demo.gif -->_

## Features

- **Notes per problem** — keyed by the canonical `cf:<contestId><INDEX>` parsed
  from the URL. One markdown note per problem, syntax-highlighted code blocks,
  rich-text rendering inside an isolated Shadow DOM.
- **Gentle revisit banner** — when you reopen a problem you've already solved,
  a small dismissible chip peeks at your prior notes. Never blocks the problem.
- **Technique tags / pattern library** — tag a note `binary-search-on-answer`
  or `dp-bitmask`. Click a tag anywhere to open every problem you've ever
  attacked with the same idea. Suggestions autocomplete from your own history.
- **Auto-scraped metadata** — title, difficulty rating, and official problem
  tags are pulled from the page DOM on first save and backfilled defensively
  later, never overwriting your own data.
- **FSRS spaced repetition** — rate `Again / Hard / Good / Easy` after solving;
  the wrapper around [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
  schedules the next review and a Review queue surfaces what's due today, most
  overdue first. The toolbar badge shows the count.
- **Dashboard** — search across title + body, filter by technique, rating
  range, or platform; sort by recency or rating.
- **Export / import** — local JSON backup with merge-by-`updatedAt` semantics;
  atomic write — malformed files leave your DB untouched.
- **Theme + shortcut** — auto / light / dark, plus `Alt+Shift+N` to toggle
  the panel (rebindable through your browser's normal extension-shortcuts UI).

## Privacy

Everything is stored locally in your browser's IndexedDB. There are no servers,
no analytics, and no telemetry. Sync happens through manual JSON
export/import — nothing leaves the browser unless you ask.

## Install

### Chrome / Edge / Brave

```bash
npm install
npm run build
```

Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**,
and pick `.output/chrome-mv3/`.

### Firefox

```bash
npm install
npm run build:firefox
```

Open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on**,
and pick `.output/firefox-mv2/manifest.json`.

### Develop

```bash
npm run dev          # Chrome, with HMR
npm run dev:firefox  # Firefox
npm test             # vitest
npm run compile      # type check
```

## How FSRS scheduling works

FSRS (the [Free Spaced Repetition Scheduler](https://github.com/open-spaced-repetition/fsrs4anki/wiki))
treats each note as a card with a `stability` and `difficulty` it has learned
from your previous reviews. After you rate `Again / Hard / Good / Easy`, FSRS
computes a new due date such that you'll be asked to recall the technique just
before you would forget it. The harder a note is for you, the more often it
surfaces. Notes never enter the review rotation until you've rated them at
least once — so adding a note doesn't pollute your queue. All scheduling is
deterministic (fuzz is disabled) and entirely local.

## Architecture

```
parser/                URL → ProblemKey · DOM scrape · pure regex tests
db/                    Dexie schema · NotesRepo · transfer (export/import merge)
srs/                   ts-fsrs wrapper · queue selector (pure, all tested)
ui/                    palette · banner logic · markdown · filters · tags
settings/              chrome.storage.local + defaults
entrypoints/
  background.ts        toolbar badge · alarms · shortcut · message routing
  content/             Shadow-DOM React mount · Panel · Banner · ContentApp
  popup/               toolbar popup with links to Review + Dashboard
  options/             Dashboard + Settings (the extension's options page)
  review/              Due queue with inline rating
```

The content script is the only thing on `codeforces.com` pages, and it lives
entirely inside a Shadow DOM so CF's CSS can't leak in and ours can't leak
out. The background worker keeps the toolbar badge accurate via
`chrome.alarms`. The platform adapter pattern (`parser/cf-dom.ts` + the
canonical `cf:` key) is set up so AtCoder / LeetCode adapters can drop in
without touching the core.

## License

MIT.
