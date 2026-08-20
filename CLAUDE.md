# Lottery repo

NY Lottery take-home calculator + investment portfolio model. Two single-file HTML apps, no build step, deployed via GitHub Pages: https://eagleadams86.github.io/lottery/

- `theme.css` here is a **copy of the generated file from `~/claude-theme-pack`** (private repo eagleadams86/claude-theme-pack) — the source of truth for the palette of ALL apps. Both HTML pages `<link>` to it. 4 themes: Midnight (default), Dark, Light, Sepia. Never edit `theme.css` directly: change `tokens.json` in the pack, run its `build.py` + `check_contrast.py`, then copy the regenerated file here. If this app ever needs a color the pack doesn't have, follow the drift policy in the pack's CLAUDE.md (flag it, don't diverge silently).
- **Both pages share one mark: the NATIVE APPS' ball, in the app family's blue** — the numbered ball from `claude-lottery-ios` / `claude-lottery-android`, on the midnight field with its two drifting corner glows. The web page, the iPhone app and the Android app are one product, so someone who has the app on their phone should recognise the tab; PAPTrack's web icon is matched to its iPhone app for the same reason. `make_favicon.py` is a **port of `claude-lottery-ios/scripts/make_icon.py`** and deliberately keeps the SAME 108x108 viewport the Android vectors use, so the two scripts read side by side — which is why this app's SVG viewBox is 108 where the rest of the family draws in 64. **If the native icon's SHAPES change, change this with them** (and vice versa: the three are one drawing in three places). The mark exists twice on the web — the script (Pillow → `favicon.ico`) and the inline SVG data URI in each page's `<head>` — and those two must stay the same picture: the SVG is what a browser shows in the tab, the `.ico` is the fallback it fetches from the site root on its own and what each header `<img>` wears. Two things the SVG does that the native icon doesn't need: the numeral is the Android path with its group transform **already applied** (the script lists the same seven points), and the rounded corner is a **clip over the whole group**, not an `rx` on the backing rect — the corner glows overflow the tile on purpose and would otherwise square it off, which is exactly what the `.ico`'s alpha mask does at the end. iOS needs neither, because it applies its own corner mask. Re-running the script means bumping `?v=` on **every** `favicon.ico` reference — two per page, four in all — or the old icon stays cached for months. **The COLOUR is where the web deliberately parts company**, and that was asked for: the native ball is near-white (`--text-primary`) with a `--text-secondary` band at 45%, while this one wears the family's two accent tones — `#a5b4fc` body, `--accent` crescent — so it sits beside its siblings as one of a set. The crescent is FLAT, not translucent: the two accent tones are close together by design, so at the native 45% it all but vanished, where 45% of a far darker `--text-secondary` gave the white ball a clear one. The phone icons still wear the pale ball and are deliberately left alone — changing those means a new build and, for iOS, a new submission. Everything but `#a5b4fc` is a real theme-pack token (`--bg`, `--surface`, `--surface-alt`, `--accent`); that one is the lighter artwork tint every other mark in the family uses, copied rather than re-picked, so nothing new enters the pack. **The ball is also SCALED UP about its own centre** — one factor in `make_favicon.py` (`BALL_SCALE`), glows untouched, and every number in the SVG is that factor already applied, so recompute them from the script rather than by hand. A home-screen icon is looked at whole and can afford air around its subject; a favicon is 16px of tab furniture beside five siblings, and at the native radius the ball covered 48% of the tile against the family's 55-70% — it read as the small one in the row. At 34.5 it covers 64% and carries the same weight as Sprint Predictability's ring beside it. The numeral still softens to a mark at 16px, which is fine: the ring and the ball are what identify it there.
- **A chart bar in the portfolio page is a tint fill plus a full-strength edge**, per rule 3 in the theme pack's CLAUDE.md: `tint()` mixes the series colour toward `--surface` and the colour itself goes on the outline. It's a drawing convention, not a palette change — no tokens involved, so it isn't drift. Two things deliberately stay solid, both tried the other way first and reverted: the **donut wedges** and the **8px legend swatches**, because those have to be told apart from each other and a tint collapses the two violets and the two greens. The **income waterfall** stays solid too — those are proportion-of-a-track meters, and an outline hides where the fill ends.
- **The calculator's winning-number balls wear official game branding, not theme tokens**: `.ball.pb` red `#b91c1c` (the Powerball) and `.ball.mb` gold `#d4a017` (the Mega Ball). Deliberate, AA-passing, and never paired red-vs-green — like the portfolio's series colours, they are not palette drift, so don't migrate them to the pack.
- `worker.js` is the Cloudflare Worker source for the jackpot CORS proxy (live at `lottery-proxy.charlie-adams-176.workers.dev`). **Editing it here does NOT update the live Worker** — deployment requires `wrangler deploy` or the Cloudflare dashboard, which the user runs, not Claude. Flag it clearly whenever this file changes.
- The worker scrapes usamega.com (fallback: lotteryusa.com), restricts CORS to `https://eagleadams86.github.io`, and returns `{pb, mm}`.
- After changes: **browser-test locally first**, then commit, push, verify the Pages deploy built, and spot-check the live pages. To serve locally, use whatever your environment provides: the desktop app's preview pane reads `.claude/launch.json` (port 8010); otherwise run `python3 -m http.server 8010` in this folder and drive a browser with whatever automation is available (e.g. Playwright). Don't spend time hunting for a specific tool — any local server + browser works. Caveat: the jackpot proxy only allows the live GitHub Pages origin, so jackpot data won't load from localhost — verify that feature on the live site. Keep README.md current.

- **`tests.html` pins the pure functions in both pages — open it (same local server, `http://localhost:8010/tests.html`) and check "All N tests pass" whenever you touch the calculator's `parseField`/`ball`/`fmtDrawDate`/`pbBlock`/`mmBlock`/`winnersValue`/`nextDraw`/`taxBreakdown` or the tax constants, or the portfolio's `computeIncome`/`parseLatest1yr`/`tint`/`posToM`/`mToPos`/`syncSlider` or the formatters.** It loads both real pages in hidden same-origin iframes and calls the functions directly (all plain `function` declarations, so no app-side hook is needed). Needs `http://localhost` — `file://` iframes are blocked in some browsers. The jackpot-proxy CORS error in the console while it runs is the documented localhost limitation, not a test failure. CI runs the same page headless on every push (`.github/workflows/tests.yml`) and fails the build if the summary goes red. When a rule pinned there changes, change the matching test in the same commit.
- **`privacy.html` is the privacy policy for both pages** (static page, same midnight shell as the sibling apps, linked from each page's footer beside the copyright line). Added 2026-08-18. Nothing is stored but preferences and nothing is sent to the three public feeds, so it is short — but every page on the shared origin carries one. Update it if either page starts talking to a new endpoint.
- Write commit subject lines in plain English a non-developer can read (what changed and why it matters, not implementation detail). The "Recent changes" section that showed them on both pages was removed 2026-08-18, across the whole app family, and the GitHub API went out of both CSPs with it.
- **`index.html` exists to stop Pages serving something else, and `.nojekyll` keeps it that
  way.** Until 2026-08-18 this repo had no index, so `https://eagleadams86.github.io/lottery/`
  served a Jekyll rendering of README.md: a page on the family's shared origin with **no CSP**
  that pulled `anchor.min.js` from cdnjs. Every page on that origin can reach the localStorage
  and sync sessions of the apps holding work data, so a third-party script on any of them is a
  hole in all of them. Don't delete either file, and if the landing page is ever restyled it
  keeps its CSP and its zero external scripts. `tests.html` pins both.
- **There IS a service worker (`sw.js`), and it covers all three pages** — one worker, scope
  `./`, registered from whichever page you open first. `lot-shell-` is its cache prefix, and
  `activate` must only ever delete caches with that prefix: Cache Storage is origin-wide and a
  sibling app's cache is not ours to touch. Only files already public in this repo are ever
  cached (`./`, both pages, `theme.css`, `privacy.html`, `favicon.ico`).
- **The three feeds are never cached, and that is a correctness rule rather than a privacy
  one.** The jackpot proxy, `data.ny.gov` and `home.treasury.gov` are cross-origin, so the
  fetch handler ignores them outright — but the reason to keep it that way is that a cached
  jackpot presented as current is a WRONG ANSWER, where a cached page is merely an old one.
  Offline, each page shows its own "couldn't load" state, which is honest.
- **No `SCHEMA` / `haltForNewerData` here, unlike every sibling app, and the reason is that
  these pages save no records.** Every key they write is a preference (theme, game, winners,
  open sections, sliders) or a cache of a public feed that refetches on the next load. The
  sibling apps need a halt because stale code there strips fields out of somebody's saved
  data and pushes the loss to their other devices; there is nothing here to lose. **If either
  page ever starts saving something a user would miss, that is the moment to add the marker
  and the halt** — `tests.html` pins the full list of stored keys precisely so that change
  cannot happen quietly.
- **A worker on Pages runs with NO CSP** (it takes its policy from its own script's response
  headers, and Pages cannot send headers), which is why `sw.js` is tiny, has no `eval`, no
  `importScripts`, no dynamic import and no cross-origin URL anywhere in it. Both pages spell
  out `worker-src 'self'` rather than letting it resolve through the fallback chain.
- **`sw-kill.js` is the escape hatch and exists before it is needed.** A bad page is fixed by
  pushing a new one; a bad worker is resident and can keep serving itself. `cp sw-kill.js
  sw.js`, commit, push.
- **Two worker traps, both silent:** `cache.addAll` is all-or-nothing (one 404 and there is no
  offline at all while everything looks healthy), and `install` fires once per script version
  (so an evicted cache is never rebuilt) — hence `topUp()` fetching entries one at a time, and
  the `shell-check` message each page sends on load. Registration is frame-guarded, or
  `tests.html` would install a worker and then test whatever it had cached.
- **Don't confuse `sw.js` with `worker.js`.** `worker.js` is the Cloudflare Worker that proxies
  jackpots, deployed separately and nothing to do with the browser. `sw.js` is the service
  worker in the page.

## Fields (2026-08-20)

- **A box you land on has its contents SELECTED**, so typing replaces the figure
  rather than running on to the end of it — one delegated `focusin` listener
  (`SELECT_ON_FOCUS`) on each of the two calculator pages, which bubbles where
  `focus` does not. Ported from Money Map, and the same block runs in every app
  in the family. Three things it must keep doing:
  - **The type list is a WHITELIST.** The portfolio page is mostly sliders, and a
    `range` has no text for `select()` to take; so does any type nobody has
    thought about yet. `data-keep-caret` is the by-hand opt-out for a single-line
    prose field — neither page has one, but the attribute is honoured here too so
    the family's block stays identical.
  - **The one-shot `mouseup` guard is load-bearing, and only for a POINTER-driven
    focus.** A click focuses on mousedown and then places the caret on mouseup,
    which collapses the selection made a moment earlier: without it the feature
    works from the keyboard and looks broken with a mouse. A `{once:true}`
    listener left hanging after a Tab would eat the caret placement of a later,
    deliberate click — hence `focusFromPointer`, set on a capturing `pointerdown`.
  - **Clicking a second time places the caret normally**, since the box is focused
    by then and no focusin fires. That is the way back in for editing rather than
    replacing, and it is why the portfolio page's slider boxes are still editable
    a character at a time.
