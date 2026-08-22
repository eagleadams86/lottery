# Lottery repo

NY Lottery take-home calculator + investment portfolio model. Two single-file HTML apps, no build step, deployed via GitHub Pages: https://eagleadams86.github.io/lottery/

- `theme.css` here is a **copy of the generated file from `~/claude-theme-pack`** (private repo eagleadams86/claude-theme-pack) — the source of truth for the palette of ALL apps. Both HTML pages `<link>` to it. 4 themes: Midnight (default), Dark, Light, Sepia. Never edit `theme.css` directly: change `tokens.json` in the pack, run its `build.py` + `check_contrast.py`, then copy the regenerated file here. If this app ever needs a color the pack doesn't have, follow the drift policy in the pack's CLAUDE.md (flag it, don't diverge silently).
- **The site is INSTALLABLE on a Mac or a PC (2026-08-21), and offline is a separate, older thing.** `manifest.webmanifest` is what turns Chrome's "Install page as app…" into a real install. Four things have to stay in step or installing silently stops being offered, with nothing but a console line to say so:
  - **`manifest-src 'self'` in the CSP of all three pages.** It falls back to `default-src`, which is `'none'` here, so without the directive the manifest fetch is refused. Suspect this first.
  - **ONE manifest, not one per page, and that is a design decision rather than a shortcut.** Both app pages wear the SAME mark on purpose, so two installs would be two identical icons in the Dock with nothing to tell them apart. `start_url` is the landing page — already a two-card launcher — and the manifest's `shortcuts` put either tool one right-click away on the icon. If the two pages ever get distinct marks, this is the decision to revisit.
  - **`make_favicon.py` writes the install icons too** — `icon-192.png`, `icon-512.png` (rounded, `purpose: any`, since nothing masks those) and `icon-512-maskable.png` (square, full bleed, since a launcher supplies its own outline). Nothing had to move for the maskable crop and the script says why: the ball is centred at (54,54) with `BALL_SCALE` putting its radius at 34.5 of the 108 viewport, inside the safe zone's 43.2. **Raise `BALL_SCALE` past 43.2 and that stops being true** — the maskable icon would then need its own smaller scale.
  - **All four files are on `sw.js`'s SHELL allowlist, and `tests.html` pins that list by exact equality.** Adding an entry means editing the test too; that is the security review, by design. Their justification is written ABOVE the array rather than between the entries, unlike the `chart.min.js` note: the suite pins the list twice, and the second pass reads the RAW source and pulls every quoted string out of it, so a comment inside the array with an apostrophe in the prose hands that pass a fake entry.
  - `<meta name="theme-color">` follows the theme on all three pages, so an installed window's title bar does not stay dark behind a light page. The two app pages read it back from the pack's `--bg` inside `setTheme()`; the landing page has no picker and sets it once in its pre-paint boot, where the stylesheet has not loaded yet — so that one **lists the four values** and has to be kept in step with `theme.css`.
  - Offline predates all of this and is unchanged: it is `sw.js`, network-first. The manifest adds the window and the icon, not the caching.
- **`color-scheme` is set per theme on ALL FOUR pages** — `dark` for midnight and dark, `light` for light AND sepia (sepia is a warm *light* theme). It is not one of our colours and overrides nothing in the pack; it is how a page tells the browser which way round it is, so browser-drawn UI follows. Without it the dark themes drew the calendar button inside a date field as a near-black glyph on a near-black box, and that glyph is not restylable from CSS — the number spinners, checkboxes and scrollbars had the same problem more quietly. Every sibling app carries the same block; these pages and Golf Handicap were the last without it.
- **Both pages wear the app family's chrome since 2026-08-21**, and the pieces of it are the same ones every sibling carries. What to know before touching any of it:
  - **`--page-w: 1500px` and `--chrome-h: 30px` live in a `:root` block at the top of each page's `<style>`.** `--page-w` is read by BOTH the content wrapper (`.page` / `.app`) and the row inside the sticky header — they have to be the same number or the mark stops lining up with the left edge of the first card, which is why neither repeats the literal. 1500px is Sprint Predictability's and Flow Metrics' number.
  - **The header is a sticky, full-width bar** with `.headbar` inside it capped to `--page-w`. Sticky, not fixed: fixed leaves the flow and the page then has to be padded by hand, which goes wrong the moment the row wraps on a phone. `z-index: 20` matters more on the portfolio page than the calculator — Chart.js canvases would otherwise scroll over the bar.
  - **One-line brand: 22px mark, name, then the strapline muted behind a middle dot.** Both pages had a title with a second line under it; the tax-basis line that used to be that second line moved into the content as `.basis`, where it qualifies the figures it applies to rather than sitting in the furniture.
  - **Each page has a skip link, a `<main id="maincontent" tabindex="-1">` and a real `<footer>`.** The family added these on 2026-08-20 and both lottery pages were missed — `privacy.html` already had the landmark pair, these two did not.
  - **The theme picker's four `<option>`s live in the MARKUP, and `THEMES` is read back off them.** Both pages built the list from script at the foot of the file into an empty `<select>` — in a header that had already painted, so the control laid out at about 40px and jumped to its full width a moment later, every load. That is the exact re-flow the family's "everything in this row is written out at its final size" rule exists to stop, and these two pages were the only ones still breaking it (2026-08-21). Midnight carries `selected`, matching what the pre-paint boot in `<head>` has already applied, so the picker never reads one theme while the page shows another. `tests.html` pins the markup, the `selected`, and that nothing writes `theme-select.innerHTML` again.
  - **One crossing per page, in the footer.** The portfolio's `← Calculator` moved out of its header, and the calculator gained a `Portfolio →` it never had. Same placement as Sprint Predictability and Flow Metrics.
- **The green take-home banner is gone (2026-08-21), and the tax breakdown opens by default.** The banner's big number was the same figure as the "Net take-home" tile a few pixels above it; the effective rate beside it was the one thing it said that nothing else did, so that survives as a single line above the breakdown it summarises. The breakdown was shut unless you had opened it before, which made the page's whole answer to "where does the money go" something you had to know to ask for — it is now open unless you closed it, the same way round as the winning numbers, and both the markup and the restore branch were flipped together so there is no shut-then-open flash on load.
- **The calculator is TWO COLUMNS at 1000px and up** (`.cols`, 5fr / 7fr) — what the page asks of you on the left, what it tells you back on the right. This is why it can take 1500px at all: it was 840px because anything wider stretched the boxes into dead space, which was true of one column and is the reason the layout changed rather than just the number. `align-items: start`, because these are two independent stacks that happen to sit side by side, not a row. **The LEFT column holds the four metric tiles and the winning numbers as well as the inputs**, which is what balances the two heights once the jackpot buttons load; the right is the tax story — the effective rate, then the breakdown. The tiles are forced two-up inside that column by a `.col-inputs .metrics-grid` rule, because the four-across rule is keyed to the VIEWPORT and a viewport query cannot see that the tiles now sit in a column a third of its width. The breakpoint is 1000px, not `--page-w`: the split is worth having on any laptop. Below it everything stacks in markup order, so the phone layout is unchanged and needs no second set of rules.
- **Both pages share one mark: the NATIVE APPS' ball, in the app family's blue** — the numbered ball from `claude-lottery-ios` / `claude-lottery-android`, on the midnight field with its two drifting corner glows. The web page, the iPhone app and the Android app are one product, so someone who has the app on their phone should recognise the tab; PAPTrack's web icon is matched to its iPhone app for the same reason. `make_favicon.py` is a **port of `claude-lottery-ios/scripts/make_icon.py`** and deliberately keeps the SAME 108x108 viewport the Android vectors use, so the two scripts read side by side — which is why this app's SVG viewBox is 108 where the rest of the family draws in 64. **If the native icon's SHAPES change, change this with them** (and vice versa: the three are one drawing in three places). The mark exists twice on the web — the script (Pillow → `favicon.ico`) and the inline SVG data URI in each page's `<head>` — and those two must stay the same picture: the SVG is what a browser shows in the tab, the `.ico` is the fallback it fetches from the site root on its own and what each header `<img>` wears. Two things the SVG does that the native icon doesn't need: the numeral is the Android path with its group transform **already applied** (the script lists the same seven points), and the rounded corner is a **clip over the whole group**, not an `rx` on the backing rect — the corner glows overflow the tile on purpose and would otherwise square it off, which is exactly what the `.ico`'s alpha mask does at the end. iOS needs neither, because it applies its own corner mask. Re-running the script means bumping `?v=` on **every** `favicon.ico` reference — two per page, four in all — or the old icon stays cached for months. **The COLOUR is where the web deliberately parts company**, and that was asked for: the native ball is near-white (`--text-primary`) with a `--text-secondary` band at 45%, while this one wears the family's two accent tones — `#a5b4fc` body, `--accent` crescent — so it sits beside its siblings as one of a set. The crescent is FLAT, not translucent: the two accent tones are close together by design, so at the native 45% it all but vanished, where 45% of a far darker `--text-secondary` gave the white ball a clear one. The phone icons still wear the pale ball and are deliberately left alone — changing those means a new build and, for iOS, a new submission. Everything but `#a5b4fc` is a real theme-pack token (`--bg`, `--surface`, `--surface-alt`, `--accent`); that one is the lighter artwork tint every other mark in the family uses, copied rather than re-picked, so nothing new enters the pack. **The ball is also SCALED UP about its own centre** — one factor in `make_favicon.py` (`BALL_SCALE`), glows untouched, and every number in the SVG is that factor already applied, so recompute them from the script rather than by hand. A home-screen icon is looked at whole and can afford air around its subject; a favicon is 16px of tab furniture beside five siblings, and at the native radius the ball covered 48% of the tile against the family's 55-70% — it read as the small one in the row. At 34.5 it covers 64% and carries the same weight as Sprint Predictability's ring beside it. The numeral still softens to a mark at 16px, which is fine: the ring and the ball are what identify it there.
- **Chart.js is vendored as `chart.min.js`, never pasted into the page and never from a CDN.** Byte-identical to the copies in Flow Metrics and Money Map — if one is ever updated, all three move together and `README.md`'s file table says the new version. It was inline on a single 200 KB line inside `lottery-portfolio.html` until 2026-08-21, and that cost three things worth remembering: the version was recorded nowhere, so nothing could tell you what was shipping; `paths-ignore: '**/chart.min.js'` in `codeql.yml` matched no file, so every scan re-reported the minifier's own redundant assignments and unreachable statements as findings **in this app's page** (30 of them, drowning anything real); and the library could not be cached separately from the page. `tests.html` pins the file, its version, and its position ahead of the app script.
- **`package.json` is a Dependabot manifest, not a build step.** It installs nothing, declares nothing but the vendored `chart.min.js`, is `private: true` with no scripts, and CI passes `--omit=dev` so npm never downloads it. **Dependabot cannot re-vendor a file**, so a version-bump PR would raise the manifest while the app kept serving the old bytes — `tests.html` pins the manifest's pin to the version string inside the bundle, which makes a manifest-only bump fail and turns the PR into the right instruction: update the file too, in all three repos that carry it (lottery, team-dashboard, financial-plan). Never add a `scripts` block, and never let the pin become a `^` range — a range cannot be checked against a file.
- **A chart bar in the portfolio page is a tint fill plus a full-strength edge**, per rule 3 in the theme pack's CLAUDE.md: `tint()` mixes the series colour toward `--surface` and the colour itself goes on the outline. It's a drawing convention, not a palette change — no tokens involved, so it isn't drift. Two things deliberately stay solid, both tried the other way first and reverted: the **donut wedges** and the **8px legend swatches**, because those have to be told apart from each other and a tint compresses exactly that. (The reason used to be written as "a tint collapses the two violets and the two greens" — that described the five colours this page invented for itself, which are gone; the point survives the palette that prompted it, and the pack now gates the ramp at full strength for the same reason.) The **income waterfall** stays solid too — those are proportion-of-a-track meters, and an outline hides where the fill ends.
- **The portfolio's five asset colours come from the pack's categorical ramp** — `--series-1` through `--series-5`, read in numeric order (SPAXX, T-bills, Munis, VTI, VXUS) by `colors()` in `lottery-portfolio.html`. `colors()` is a **function, not a const**: `setTheme()` re-runs `render()`, so the values must be re-read from the document each pass or a theme switch keeps the previous theme's colours. Until 2026-08-21 this page carried five hex literals of its own — the only invented palette in the family — and two of them came out identical under deuteranopia (ΔE 0.7). **Tax drag is `--err` plus a diagonal stripe**, not a sixth series colour: on Light and Sepia `--err` is only ΔE 8.8–11.6 from `--series-5` (both the rust-red family), and the drag is stacked directly on the asset segment it subtracts from, so the hatch is what actually separates them. Same "never the fill alone" rule the pack states for status, and the same `stripes()` helper Money Map uses.
- **The calculator's winning-number balls wear official game branding, not theme tokens**: `.ball.pb` red `#b91c1c` (the Powerball) and `.ball.mb` gold `#d4a017` (the Mega Ball). Deliberate, AA-passing, and never paired red-vs-green: they are a third party's brand, not this app's palette, so they are not drift and must not migrate to the pack. **The portfolio's series colours used to be excused the same way and that was wrong** — they were this app's own invented palette, two of them (`#378ADD` and `#7F77DD`) simulating to the same colour under deuteranopia, and they moved into the pack as `--series-1`…`--series-5` on 2026-08-21. A brand colour someone else owns and a palette we picked ourselves are not the same case.
- `worker.js` is the Cloudflare Worker source for the jackpot CORS proxy (live at `lottery-proxy.charlie-adams-176.workers.dev`). **Editing it here does NOT update the live Worker** — deployment requires `wrangler deploy` or the Cloudflare dashboard, which the user runs, not Claude. Flag it clearly whenever this file changes.
- The worker scrapes usamega.com (fallback: lotteryusa.com), restricts CORS to `https://eagleadams86.github.io`, and returns `{pb, mm}`.
- After changes: **browser-test locally first**, then commit, push, verify the Pages deploy built, and spot-check the live pages. To serve locally, use whatever your environment provides: the desktop app's preview pane reads `.claude/launch.json` (port 8010); otherwise run `python3 -m http.server 8010` in this folder and drive a browser with whatever automation is available (e.g. Playwright). Don't spend time hunting for a specific tool — any local server + browser works. Caveat: the jackpot proxy only allows the live GitHub Pages origin, so jackpot data won't load from localhost — verify that feature on the live site. Keep README.md current.

- **`tests.html` pins the pure functions in both pages — open it (same local server, `http://localhost:8010/tests.html`) and check "All N tests pass" whenever you touch the calculator's `parseField`/`ball`/`fmtDrawDate`/`pbBlock`/`mmBlock`/`winnersValue`/`nextDraw`/`taxBreakdown` or the tax constants, or the portfolio's `computeIncome`/`parseLatest1yr`/`tint`/`posToM`/`mToPos`/`syncSlider` or the formatters.** It loads both real pages in hidden same-origin iframes and calls the functions directly (all plain `function` declarations, so no app-side hook is needed). Needs `http://localhost` — `file://` iframes are blocked in some browsers. The jackpot-proxy CORS error in the console while it runs is the documented localhost limitation, not a test failure. CI runs the same page headless on every push (`.github/workflows/tests.yml`) and fails the build if the summary goes red. When a rule pinned there changes, change the matching test in the same commit.
- **`privacy.html` is the privacy policy for both pages** (static page, same midnight shell as the sibling apps, linked from each page's footer beside the copyright line). Added 2026-08-18. Nothing is stored but preferences and nothing is sent to the three public feeds, so it is short — but every page on the shared origin carries one. Update it if either page starts talking to a new endpoint.
- Write commit subject lines in plain English a non-developer can read (what changed and why it matters, not implementation detail). The "Recent changes" section that showed them on both pages was removed 2026-08-18, across the whole app family, and the GitHub API went out of both CSPs with it.
- **The landing page is a `<main>` / `<footer>` pair as well (2026-08-21).** Both tools and
  `privacy.html` gained the landmarks on 2026-08-20 and the launcher was missed — it was a
  `<div>` of prose with a styled `<p class="note">` at the foot. `</main>` closes BEFORE the
  `<footer>`, for the reason spelled out in the privacy-page section below: a `<footer>` nested
  inside `main` is not contentinfo at all. `.note` sets `margin`, not `margin-top`, now that
  the element carrying it is no longer a `<p>`.
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
  cached (`./`, both pages, `theme.css`, `chart.min.js`, `privacy.html`, `favicon.ico`).
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

## The Privacy Page's Footer and Landmarks (2026-08-21)

This page grew the family footer — the repo under **How it works**, and the authorship line —
before any of its four siblings, and was the only one carrying it until they were brought into
line. What changed here is the markup around it, done to all five together.

- **The footer is a real `<footer>`, and the policy is in a real `<main>`.** A styled `<p>` is
  not a landmark, and a page whose only landmark is contentinfo is worse than one with none —
  the policy itself would sit in no landmark at all. Both went in together.
- **`</main>` closes BEFORE the `<footer>`, and that ordering is the whole thing.** A
  `<footer>` nested inside `main`, `article` or `section` is **not** contentinfo — it is a
  plain footer for that section. So `.wrap` stays an ordinary `<div>` rather than becoming the
  `<main>`, which would have swallowed the footer and left the page with no contentinfo at all
  while looking perfectly correct in the source. The test asserts the ORDER, not just the tags.
- The back link stays outside `<main>` — it is navigation, not the document.
- **No privacy link in this footer**, unlike the app pages' — you are standing on that page.
  That absence is asserted, not merely omitted.
- **The tests strip HTML comments and match the footer by its class**, because the notes beside
  both elements name them in prose and one of those notes lives in the `<style>` block, which
  an HTML-comment strip does not reach. Without both, a page that had lost the element and kept
  the comment explaining it would still pass — which is how the first version of this test
  failed.
- `.foot` sets `margin`, not `margin-top`, so the rule no longer depends on which element
  carries it.

- **`tests.html` fetches `privacy.html` too** (2026-08-21), alongside the sources it already
  grabbed. It is one more `grab()` in `loadSources()` and one more group; the page had never
  been read by the suite at all, which is how it stayed the only privacy page in the family
  with a footer and then, briefly, the only one without landmarks.

- **The privacy page's back link lives in a `<nav>` (2026-08-21).** It stays OUTSIDE `<main>`
  — it is navigation, not the document — but "outside main" is not the same as "outside every
  landmark", which is where it sat: axe-core's `region` rule found it on all six privacy pages
  at once. The `<nav>` carries an `aria-label` naming where it goes back to.
- **Decorative glyphs on buttons are `aria-hidden` everywhere, not just in the header.** The
  header row got the treatment on 2026-08-21 and the rest of the app did not, so a screen
  reader still read "downwards black arrow, Export JSON" in every dialog. Around 50 buttons
  across the family were wrapped in the same pass. The sync button is the exception that
  proves it: its label is rewritten with `textContent` as the state changes, so a span there
  would be blown away — it carries an `aria-label`, re-stated in every branch of `updateUI()`
  so it can never be left describing the previous state.
