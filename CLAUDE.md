# Lottery repo

NY Lottery take-home calculator + investment portfolio model. Two single-file HTML apps, no build step, deployed via GitHub Pages: https://eagleadams86.github.io/lottery/

- `theme.css` is the **single source of truth** for colors and all 7 theme palettes — both HTML pages `<link>` to it. Theme changes are one edit there, never duplicated into the HTML files.
- `worker.js` is the Cloudflare Worker source for the jackpot CORS proxy (live at `lottery-proxy.charlie-adams-176.workers.dev`). **Editing it here does NOT update the live Worker** — deployment requires `wrangler deploy` or the Cloudflare dashboard, which the user runs, not Claude. Flag it clearly whenever this file changes.
- The worker scrapes usamega.com (fallback: lotteryusa.com), restricts CORS to `https://eagleadams86.github.io`, and returns `{pb, mm}`.
- After changes: **browser-test locally first**, then commit, push, verify the Pages deploy built, and spot-check the live pages. To serve locally, use whatever your environment provides: the desktop app's preview pane reads `.claude/launch.json` (port 8010); otherwise run `python3 -m http.server 8010` in this folder and drive a browser with whatever automation is available (e.g. Playwright). Don't spend time hunting for a specific tool — any local server + browser works. Caveat: the jackpot proxy only allows the live GitHub Pages origin, so jackpot data won't load from localhost — verify that feature on the live site. Keep README.md current.

- **Commit subjects are user-facing:** each page shows its last 10 commit messages in a public "Recent changes" section. Write commit subject lines in plain English a non-developer can read (what changed and why it matters, not implementation detail).
