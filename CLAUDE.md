# Lottery repo

NY Lottery take-home calculator + investment portfolio model. Two no-build HTML apps deployed via GitHub Pages: https://eagleadams86.github.io/lottery/ — each is one file plus the ones it shares with its sibling (`theme.css`, `tax.js`, and `chart.min.js` on the portfolio).

- **`tax.js` is the tax law, and it is ONE FILE ON PURPOSE (2026-08-22).** Both pages load it
  with `<script src="tax.js">` ahead of their own script. Before this the calculator carried
  `FED_WH/FED_TOP/NY_WH/NY_TOP` and the portfolio carried `FED/NY/LTCG/NIIT` — the same tax law
  written down twice, in two files, with nothing keeping them in step. Rates move every January.
  Things to know before touching it:
  - **The flat rates were right at the top and wrong everywhere else, and that was the bug.** A
    $100M jackpot really is taxed at ~47.9%, so nothing looked broken. A $500K share was quoted
    at 47.9% when it is about 34.5%, and the page had supported that case since the take-home
    slider went log-scaled. **Any change here must keep the $100M answer at 47.9%** — that is
    what the "a jackpot still lands on the top rates" test is for.
  - **New York's recapture is the one deliberate approximation**, and it is written out beside
    the constant. Above $107,650 the state claws back the lower brackets over a $50,000 phase-in
    until the whole taxable income sits at the top rate reached. Modelled as that general rule
    rather than as NY's six per-status worksheets, which are re-issued yearly. Exact at the top
    band (Tax Law §601 says so outright over $25M), and a test asserts it is **never lower**
    than the plain bracket sum, so it can never flatter the answer.
  - **Withholding is not a bracket and must not become one.** `FED_WH` 24% and `NY_WH` 10.9%
    are fixed by law regardless of what is owed; `WH_FLOOR` is $5,000. That asymmetry is why
    both pages show "withheld" and "settled" as two numbers, and why a smaller prize now
    produces a REFUND — a case that could not exist while New York was a flat 10.9%.
  - **`TAX_YEAR` is the one place the year lives**, and a test checks both pages read it from
    there rather than writing "2026" into their own prose. Bumping the year means bumping the
    tables with it.
  - `filingStatus()` and `residence()` are the boundary checks everything else leans on — both
    values arrive from stored preferences AND from share links, so nothing downstream may index
    a rate table with a string that has not been through them.
- **Both pages carry a `↗ Share` button, and a shared link is A LOOK, NOT A SAVE (2026-08-22).**
  Every sibling app had one and these two did not. The payload is a dozen numbers and two words
  picked from lists, so it is plain base64url of the JSON behind a `#s=` marker — no deflate
  step, unlike Sprint Predictability's, because there is nothing to compress.
  - **The window itself is Sprint Predictability's, token for token (2026-08-22).**
    These two pages had no button and no dialog at all until the day Share arrived, so the
    first version invented its own rules and did not match the four apps it sits beside.
    What it now copies: `dialog` at **560px** (the family's NARROW width — Flow Metrics'
    and Golf Handicap's, and what Sprint Predictability drops to for a window that is one
    panel rather than a form), 20px padding, `--bg-card` on `--border-strong`, an `h3` at
    17px, the link inside a `fieldset.formpanel` under a `<legend>Your Link</legend>`, and
    **Copy link / Preview it / Done** in that order with only the first and last primary.
    Two of the original rules were WRONG rather than merely different, and `tests.html`
    pins both: `.btn` had `--btn-bg` as its default background, which is the PRIMARY
    treatment, so the header's Share button drew filled where every sibling draws it plain;
    and `.btn.primary` used `--accent`, which is the link colour, not the button one.
  - **`margin: auto` is written out on the dialog, and it is the one line the siblings do
    NOT need.** A modal `<dialog>` is centred by the browser's own stylesheet, which gives
    it `position: fixed; inset: 0; margin: auto` — that auto margin IS the centring. Both
    these pages open with a `*, *::before, *::after { margin: 0 }` reset, which beats the UA
    rule, so the window opened jammed in the top-left corner while every sibling's opened in
    the middle. **None of the four sibling apps has that reset**, which is exactly why
    copying their dialog rule token for token was not enough: the rule leans on a default
    this repo had already knocked out, and nothing about the copied CSS says so. `tests.html`
    pins the margin AND the reset together, so if the reset ever goes the test is what says
    the margin no longer has to be written down. The general lesson is the useful one — when
    a rule is lifted from a sibling app, check what it was relying on that this repo removes.
  - **The dialog carries the two iOS fixes the rest of the family got in August and these
    pages missed**, because they had no dialog when those landed: `max-height: calc(100vh
    - 32px)` with `overflow: auto` (a tall dialog on a short laptop otherwise opens already
    scrolled past its own heading, because `showModal()` focuses the first control and drags
    it into view — and **vh, not dvh**, since dvh resolves to 0 in some embedded engines),
    and `overscroll-behavior: contain` (without it the page behind carries on scrolling once
    the dialog runs out — found on real iOS Safari in Money Map).
  - **"Preview it" opens a new tab, not this one.** It is the family's second button and the
    only way to answer "what does the person I send this to actually see?" without mailing it
    to yourself — and the figures the link was made from have to still be there to compare
    against, which is why it is not a navigation.
  - **One thing deliberately NOT copied: Sprint Predictability's `box-shadow: var(--shadow)`
    — and on 2026-08-23 that app dropped it too.** The reasoning here was that `--shadow` is
    not a theme-pack token: four apps each defined it locally, four values deep, which is
    twenty-odd colour values the pack never gated, in a family whose whole premise is that
    colour lives in the pack. That reasoning won family-wide. Charles was shown the same
    window with the shadow, without it, and with a deliberately heavier one, in all four
    themes, and could not tell them apart — on a dark theme a black shadow falls on a
    surface that is already almost black, and a modal's backdrop hides the rest. There are
    no elevation shadows anywhere in the family now; it is hard rule 14 in the pack, and
    `check_consumers.py` fails a page that adds one. These pages were right early.
  - **`remember()` is the guard, and it is sticky for the whole visit.** A page opened from
    someone else's link saves none of the figures even if you change every one of them; "Back
    to mine" drops the fragment and reloads. Cleared on the first edit was the alternative and
    it is worse: touch one control and the sender's other eleven figures silently become yours.
    (The theme and which sections you left open are still saved — they are your furniture and
    no link carries them.)
  - **A `hashchange` listener is load-bearing.** Pasting a link into a tab already on the page
    changes only the fragment, which is not a navigation — nothing reloads and nothing runs.
    That is the most likely way anyone opens one, since the page is already in front of them.
  - **Because most writes now go through `remember()`, the stored-keys test scans BOTH
    spellings.** A scan for `localStorage.setItem('…')` alone would quietly stop seeing five
    keys and go on passing while covering less.
- **The calculator answers the annuity question too (2026-08-22).** Payout is `lump` /
  `annuity` / `compare`. Powerball and Mega Millions pay 30 payments growing 5% a year; NY
  Lotto pays 26 equal ones, and **the plan follows the winning-numbers game selector**, which
  is the page's one "which game" answer. The first payment is the jackpot over the SUM OF THE
  GROWTH FACTORS (66.44 for 30 at 5%), not over 30 — getting that wrong overstates the first
  cheque by a third. `breakEvenRate()` bisects rather than solving, because an after-tax
  annuity stream is not a closed form once every payment has been through a bracket table.
- **Six games in the winning numbers, and two of New York's are deliberately absent.** Cash 4
  Life's dataset is still served but the GAME IS RETIRED, so it would pin "the latest results"
  to a February draw for ever; Millionaire for Life is its replacement and is in. Quick Draw is
  out for the opposite reason — it draws every four minutes. `knownGame()` uses
  `hasOwnProperty`: `WN_GAMES['constructor']` is truthy on any plain object, so a bare lookup
  let a share link through to a fetch of `undefined.json`.
  **CodeQL reports four `js/remote-property-injection` alerts on `winData[g]` and `cache[g]`
  in `fetchWinning()`, and they are dismissed as false positives (2026-08-22) — don't
  "fix" them.** The analyzer cannot see through `knownGame()`, so it treats `wnGame` as
  attacker-controlled at the write; it is not, because that helper is the only way the
  variable is ever set and it is a `hasOwnProperty` whitelist over the six-key table. The
  READ path was audited in the same pass and is what actually matters here, since a poisoned
  `lottery-winning-cache` really is reachable from any page on the shared origin: `ball()`
  refuses anything that is not `/^\d{1,2}$/`, `fmtDrawDate()` anything that is not
  `/^\d{4}-\d{2}-\d{2}/`, the game name and CSS class are hardcoded constants, and the Power
  Play multiplier goes through `parseInt`. A crafted cache entry therefore renders nothing at
  all. Rewriting a correct, already-defended guard into something the analyzer happens to
  recognise — a `Map`, or an inlined six-way comparison — would cost readability and buy no
  safety, which is why the alerts were dismissed rather than coded around.
- **The portfolio's "Does it last?" section tracks a COST BASIS, and that is the subtle part.**
  Forty years of the same model: spending rises with inflation, income after tax is taken as
  cash, shares are sold for the rest plus the capital-gains tax on the sale. The basis is a
  FRACTION and only GROWTH moves it — the tempting "reduce the basis by the amount sold" is
  exactly the mistake that would make later years tax-free, and there is a comment saying so at
  the line where it would be made. Three lines on the chart, your rate ±3 points: a stated
  spread, not a confidence interval, and the note under it says so.
- **Printing is the PACK's job now, not these pages' (2026-08-22).** `theme.css` grew a
  `@media print` block the same day these two pages grew theirs, and the two overlapped: the
  pages were hard-coding `#fff`, `#000` and `#999`, which is drift anywhere in this repo and is
  now also wrong, because those literals would override a print palette that was chosen
  properly and put through the contrast gate. **Nothing in either page's print block names a
  colour, and `tests.html` fails if one appears.** What the pack does: swaps the dark themes to
  the Light palette, hides `.headbar button` / `.headbar .btn` and the sibling apps' theme
  pickers, makes the sticky header static, sets `@page`, repeats table headings, stops rows
  tearing, and keeps a `<canvas>` printing in colour. What the PAGES still do: open their
  collapsed sections (paper has no disclosure triangle), drop to one column, un-cap the
  schedule's scroll box, and hide their own furniture.
  - **`.no-print` is the pack's handle for furniture it cannot see, and the theme picker needs
    it here.** The pack hides `#themeSel` and `.theme-sel` — the sibling apps' names — and these
    two pages call theirs `theme-select`. The Copy As CSV row carries it too: a button that
    prints itself is the definition of furniture.
  - **A stale `theme.css` will hide all of this from you.** Both pages link it unversioned (so
    do all four siblings), so a browser holds on to it hard. Verifying print behaviour against a
    cached copy is how this was nearly missed — the pack's rules were on disk and simply not in
    the page. Same trap as the frames in `tests.html`, one file over.
- **`tests.html` busts the cache for the frames AND the source fetches, and that is not tidiness
  (2026-08-22).** The suite reported all-green against a portfolio page three features out of
  date: the source-level tests were reading the file off the server while the hidden frames ran
  a copy the browser had cached. One `BUST` constant now feeds both. If a test ever passes when
  you expect it to fail, check `iframe.contentWindow` has the function you just wrote before
  believing anything.
- `theme.css` here is a **copy of the generated file from `~/claude-theme-pack`** (private repo eagleadams86/claude-theme-pack) — the source of truth for the palette of ALL apps. Both HTML pages `<link>` to it. 4 themes: Midnight (the base palette), Dark, Light, Sepia — plus `auto`, which is a picker entry and a resolution rule rather than a fifth palette, and which is the **default** since 2026-08-22. Never edit `theme.css` directly: change `tokens.json` in the pack, run its `build.py` + `check_contrast.py`, then copy the regenerated file here. If this app ever needs a color the pack doesn't have, follow the drift policy in the pack's CLAUDE.md (flag it, don't diverge silently).
- **The site is INSTALLABLE on a Mac or a PC (2026-08-21), and offline is a separate, older thing.** `manifest.webmanifest` is what turns Chrome's "Install page as app…" into a real install. Four things have to stay in step or installing silently stops being offered, with nothing but a console line to say so:
  - **`manifest-src 'self'` in the CSP of all three pages.** It falls back to `default-src`, which is `'none'` here, so without the directive the manifest fetch is refused. Suspect this first.
  - **ONE manifest, not one per page, and that is a design decision rather than a shortcut.** Both app pages wear the SAME mark on purpose, so two installs would be two identical icons in the Dock with nothing to tell them apart. `start_url` is the landing page — already a two-card launcher — and the manifest's `shortcuts` put either tool one right-click away on the icon. If the two pages ever get distinct marks, this is the decision to revisit.
  - **`make_favicon.py` writes the install icons too** — `icon-192.png`, `icon-512.png` (rounded, `purpose: any`, since nothing masks those) and `icon-512-maskable.png` (square, full bleed, since a launcher supplies its own outline). Nothing had to move for the maskable crop and the script says why: the ball is centred at (54,54) with `BALL_SCALE` putting its radius at 34.5 of the 108 viewport, inside the safe zone's 43.2. **Raise `BALL_SCALE` past 43.2 and that stops being true** — the maskable icon would then need its own smaller scale.
  - **All four files are on `sw.js`'s SHELL allowlist, and `tests.html` pins that list by exact equality.** Adding an entry means editing the test too; that is the security review, by design. Their justification is written ABOVE the array rather than between the entries, unlike the `chart.min.js` note: the suite pins the list twice, and the second pass reads the RAW source and pulls every quoted string out of it, so a comment inside the array with an apostrophe in the prose hands that pass a fake entry.
  - `<meta name="theme-color">` follows the theme on all three pages, so an installed window's title bar does not stay dark behind a light page. The two app pages read it back from the pack's `--bg` inside `setTheme()`; the landing page has no picker and sets it once in its pre-paint boot, where the stylesheet has not loaded yet — so that one **lists the four values** and has to be kept in step with `theme.css`.
  - Offline predates all of this and is unchanged: it is `sw.js`, network-first. The manifest adds the window and the icon, not the caching.
- **A control is only on screen where it changes something, and a figure says whose it
  is** (both 2026-08-22, both reported by Charles, both the same fault). The discount
  rate showed for the annuity as well as Compare, on the reasoning that it "decides
  nothing about a lump sum" — which quietly assumed the annuity view discounted
  something. It does not: its four tiles are the first payment, the share, the tax over
  the run and the net over the run, all undiscounted, and the schedule under them is
  per-year gross/tax/net. It is now `payout === 'compare'` only. **The one place it still
  reaches from another tab is the CSV**, which carries an "Annuity in today's money at
  N%" row — that row names its own rate, so it stays honest with the field off screen.
  Separately, the effective rate and the breakdown beneath it **follow the winner on
  Compare** (2026-08-22). `annuityAhead` is decided ONCE, near the top of the render,
  and everything that has to agree reads it: the tiles, the cards' "Ahead here" badge,
  `showingAnnuity`, `#eff-rate`, `#eff-scope`, `#details-scope` and the payment
  schedule. `showingAnnuity` — "is the annuity what this page is currently describing?"
  — is the single answer behind all three panels; **the schedule used to hold a
  `wantsAnnuity` of its own** (annuity OR compare) and so stayed on screen with thirty
  rows of annuity payments beneath a verdict recommending the lump sum. It was worked
  out twice before — `better` in the tiles and `lumpWins` in the cards, complements of
  each other — which was survivable while nothing else consulted it. **Ties go to the
  annuity** (`>=`), as they always did in the tiles; flipping that comparison moves
  which payout the whole page describes at exactly the break-even rate.
  **One breakdown, not two side by side, and that is deliberate:** the lump sum's
  describes the whole prize and the annuity's describes the FIRST of thirty payments,
  so in adjacent columns they invite comparing $300M against $7.5M. The comparable
  pair — after tax, and in today's money — is already on the cards. Showing both would
  mean inventing a run-totals breakdown for the annuity, which duplicates the
  schedule's Total row and gives up "the first payment is the one you can check
  against a real cheque".
  **If a fifth view is ever added, all of this has to be answered again for it.**

- **The calculator carries the family's info dot** (2026-08-22; brought onto the
  family blocks 2026-08-23): `.tile-help` with a `data-help` key, one `#helpDialog`, one
  delegated listener, and a `HELP` map of `[title, html]`. It arrived here as a copy of
  Golf Handicap's `.help-btn` — a "?" in a filled 18px pill — and Golf Handicap turned out
  to be the odd one out: three other apps drew a 16px outlined **"i"**, which is the glyph
  that survives. "?" is what a browser already puts on its own help cursor and in a form's
  validation bubble, and it asks a question where this thing answers one. Both blocks —
  the dot and the window — are now declared property by property and are the same in every
  app; a change to either belongs in all of them. **The help ids on this page are the
  family's camelCase** (`helpDialog`, `helpTitle`, `helpBody`) rather than the kebab this
  page uses everywhere else, because the shared block names them and the block is verbatim.
  The window is sized by its own text — `#helpBody` capped at 66 characters, `#helpDialog`
  at `width: fit-content`, `padding: 20px` — which comes out at 666px, the same figure as
  Money Map. It is dismissed with **Got It**, as everywhere else, on `id="helpCloseBtn"`.
  **The type and the colour are in the block too** (2026-08-23, a second pass after Charles
  spotted differences between the windows). Both lottery pages were drifting by
  inheritance: `dialog h3` here sets a size but no WEIGHT, so the heading defaulted to bold
  (700) where every sibling showed 600; and this page has no `dialog p` rule at all, so the
  prose inherited the dialog's `--text-primary` and read brighter than everywhere else —
  which also left `#helpBody strong` the same colour as the paragraph around it, so bold
  had nothing to lift it. `#helpTitle`, `#helpBody`'s colour, the paragraph margins and
  `#helpBody strong` are all declared now.
  Three things to keep right when adding one: the html in `HELP` is a **literal in this
  file** and nothing a reader typed may ever reach that `innerHTML`; every dot needs an
  `aria-label`, because a bare glyph reads as nothing; and a heading whose text the script
  rewrites with `textContent` needs its id moved onto an inner `<span>` first, or the
  assignment deletes the button (`wt-title` and `rt-title` are both like this).
  `tests.html` pins that the dots and the `HELP` keys are the same set in both
  directions — a dot with no entry opens nothing, an entry with no dot is unreachable —
  and, since 2026-08-23, the glyph, the circle and both window rules.
  **Every note on both pages is paragraphs and bolds something**, also pinned: over about
  380 characters a note is `<p>` blocks, every note bolds the thing it defines or the claim
  it turns on, and **bold stays under about 40% of the characters**. That last one is a
  SHARE and deliberately not "one bold per paragraph" — a note that defines a list bolds one
  term per item and is right to. "Withheld at Payment" had no bold at all until this date.
  **Split the table on the entry boundary, never `matchAll` with a `$` alternative:** under
  the `m` flag `$` is end-of-LINE, so a lazy body stops at the first newline and every entry
  reads as a single paragraph.
- **EVERY dialog on both pages closes on a backdrop click, through the family's
  `closeOnBackdropClick`** (2026-08-23). The portfolio's help window had nothing at all —
  the only window in the family you could not click off — and both share windows tested
  `e.target === this` on its own, which is wrong twice over: a click on the backdrop reports
  the dialog as the target, but **so does one on the dialog's own 20px of padding**, and a
  press that starts inside and releases outside (dragging a selection out of the link box)
  counted as a dismissal. The helper tests the pointer against the dialog's BOX and requires
  both the press and the release to land outside. The one documented exception family-wide
  is the sync "which copy of your data?" dialog, and neither page here syncs.
  `tests.html` **enumerates the dialogs from the markup** rather than listing them, so a
  window added later is covered the day it is added — which is exactly the gap that let the
  portfolio's help window ship unwired. **Match the button
  tag with `<button[^>]*class="tile-help"`, never `<button class=`:** three of the four
  dots here put the class on the tag's second line, and the anchored version silently
  matched one button while the loop over it went on passing.
- **The portfolio carries the same two blocks, and got them the same day** (2026-08-23). It
  had no help at all until the family sweep, and it is the page with the most arithmetic
  behind the fewest visible numbers. **Three dots and no more** — `assumptions`, `summary`,
  `breakdown` — and the restraint is the point: the 10-year projection and "Does it last?"
  each carry a paragraph of prose underneath them already, and the waterfall is the
  breakdown's own arithmetic totalled up. What the three cover is what the page cannot say
  in a number: that take-home has already been through lottery tax, that SPAXX is fixed at
  4.3% with no slider while the T-bill yield is the Treasury's published one, that the
  ladder is sized off SPENDING and not off the pot, and that the per-row percentages are
  averages over a category rather than brackets.
  **Two mechanical traps here that the calculator does not have.** A section heading is
  itself a `<button>` that collapses the section, and a button may not contain another one —
  so the dot is the heading's SIBLING, `.sec-hd` becomes the flex row, and the dot carries
  the label's own `margin-bottom: 10px` or it rides high. And this page's `* { margin: 0 }`
  reset knocks out the `margin: auto` a modal `<dialog>` is centred by, so the dialog rule
  restates it; with `width: fit-content` on top, losing that line parks the help window in
  the top-left corner. Both are pinned.
- **All three disclosures open EXPANDED, and each remembers being closed.** The payment
  schedule was the exception until 2026-08-22 — it opened shut, so the thirty figures an
  annuity consists of were something you had to know to ask for. Opening it open is what
  made its `localStorage` write necessary: while it opened shut, closing it was a no-op
  worth saving nothing. All three restore with the same `=== '0'` test, so only a visitor
  who actually closed one gets it collapsed. A new stored key must also be added to the
  allowlist in `tests.html` — that list is deliberately exact, and it is what caught
  `lottery-sched`.

- **`color-scheme` is set per theme on ALL FOUR pages** — `dark` for midnight and dark, `light` for light AND sepia (sepia is a warm *light* theme). It is not one of our colours and overrides nothing in the pack; it is how a page tells the browser which way round it is, so browser-drawn UI follows. Without it the dark themes drew the calendar button inside a date field as a near-black glyph on a near-black box, and that glyph is not restylable from CSS — the number spinners, checkboxes and scrollbars had the same problem more quietly. Every sibling app carries the same block; these pages and Golf Handicap were the last without it.
- **Both pages wear the app family's chrome since 2026-08-21**, and the pieces of it are the same ones every sibling carries. What to know before touching any of it:
  - **`--page-w: 1500px` and `--chrome-h: 30px` live in a `:root` block at the top of each page's `<style>`.** `--page-w` is read by BOTH the content wrapper (`.page` / `.app`) and the row inside the sticky header — they have to be the same number or the mark stops lining up with the left edge of the first card, which is why neither repeats the literal. 1500px is Sprint Predictability's and Flow Metrics' number.
  - **The header is a sticky, full-width bar** with `.headbar` inside it capped to `--page-w`. Sticky, not fixed: fixed leaves the flow and the page then has to be padded by hand, which goes wrong the moment the row wraps on a phone. `z-index: 20` matters more on the portfolio page than the calculator — Chart.js canvases would otherwise scroll over the bar.
  - **One-line brand: 22px mark, name, then the strapline muted behind a middle dot.** Both pages had a title with a second line under it; the tax-basis line that used to be that second line moved into the content as `.basis`, where it qualifies the figures it applies to rather than sitting in the furniture.
  - **Each page has a skip link, a `<main id="maincontent" tabindex="-1">` and a real `<footer>`.** The family added these on 2026-08-20 and both lottery pages were missed — `privacy.html` already had the landmark pair, these two did not.
  - **The theme picker's four `<option>`s live in the MARKUP, and `THEMES` is read back off them.** Both pages built the list from script at the foot of the file into an empty `<select>` — in a header that had already painted, so the control laid out at about 40px and jumped to its full width a moment later, every load. That is the exact re-flow the family's "everything in this row is written out at its final size" rule exists to stop, and these two pages were the only ones still breaking it (2026-08-21). Auto carries `selected`, matching what the pre-paint boot in `<head>` has already applied — and what `<html data-theme="auto">` applies when that script never runs — so the picker never reads one theme while the page shows another. It was Midnight until 2026-08-22, when the family default moved. `tests.html` pins the markup, the `selected`, and that nothing writes `theme-select.innerHTML` again.
  - **One crossing per page, in the footer.** The portfolio's `← Calculator` moved out of its header, and the calculator gained a `Portfolio →` it never had. Same placement as Sprint Predictability and Flow Metrics.
- **The green take-home banner is gone (2026-08-21), and the tax breakdown opens by default.** The banner's big number was the same figure as the "Net take-home" tile a few pixels above it; the effective rate beside it was the one thing it said that nothing else did, so that survives as a single line above the breakdown it summarises. The breakdown was shut unless you had opened it before, which made the page's whole answer to "where does the money go" something you had to know to ask for — it is now open unless you closed it, the same way round as the winning numbers, and both the markup and the restore branch were flipped together so there is no shut-then-open flash on load.
- **The calculator is TWO COLUMNS at 1000px and up** (`.cols`, EQUAL halves) — what the page asks of you on the left, what it tells you back on the right. **The split is down the CENTRE, and `tests.html` pins it there** (2026-08-22): it was 5fr / 7fr on the reasoning that the results side carries more to say, which is the conclusion a later tidy-up will reach again — it does not hold, because the left column carries the game buttons, the manual fields, the payout controls, the four tiles AND the winning numbers, so the two stacks come out close in height at equal widths. Both tracks are `minmax(0, 1fr)`; without the zero minimum the annuity's 32-row payment schedule sets its own column's floor and pushes the split off centre by itself. This is why it can take 1500px at all: it was 840px because anything wider stretched the boxes into dead space, which was true of one column and is the reason the layout changed rather than just the number. `align-items: start`, because these are two independent stacks that happen to sit side by side, not a row. **The LEFT column holds the four metric tiles and the winning numbers as well as the inputs**, which is what balances the two heights once the jackpot buttons load; the right is the tax story — the effective rate, then the breakdown. The tiles are forced two-up inside that column by a `.col-inputs .metrics-grid` rule, because the four-across rule is keyed to the VIEWPORT and a viewport query cannot see that the tiles now sit in a column half its width. The breakpoint is 1000px, not `--page-w`: the split is worth having on any laptop. Below it everything stacks in markup order, so the phone layout is unchanged and needs no second set of rules. **`.input-grid` uses `minmax(0, 1fr)` and not a bare `1fr`**, fixed 2026-08-22: a bare `1fr` is `minmax(auto, 1fr)`, so a track refuses to shrink below its content's minimum — the two amount cards (text box plus M/B toggle, about 290px each) overflowed the narrow left column and the second card's toggle was drawn under the results column. Nothing scrolled and nothing errored; the control was simply half there.
- **THE FAMILY'S TILE-ROW RULE IS NOT ON EITHER PAGE, AND HERE IS WHY (2026-08-23).** Money Map, Sprint Predictability and Flow Metrics now answer one rule in CSS: a tile row fills ONE line when the line has room for every tile and splits into EQUAL rows when it does not — the count read by `:has(> :nth-child(N):last-child)`, the width by a CONTAINER query — because their rows vary in count and `auto-fit` was stranding a lone tile on a row of its own. Nothing here varies: `.metrics-grid` and the portfolio's `.metrics` are four cards, always, four across or 2 × 2, and `.cmp` is exactly two. All three are gap-free at every width already. What is worth knowing is that the container half of that rule is the clean answer to the hack noted above — `.col-inputs .metrics-grid` exists only because a viewport query cannot see that the tiles have moved into a column half the page's width, and a container query can. It is not worth swapping a working, test-pinned rule for it today; it IS the thing to reach for if a second exception like it is ever needed, or if a row here ever starts varying in count.
- **Both pages share one mark: the NATIVE APPS' ball, in the app family's blue** — the numbered ball from `claude-lottery-ios` / `claude-lottery-android`, on the midnight field with its two drifting corner glows. The web page, the iPhone app and the Android app are one product, so someone who has the app on their phone should recognise the tab; PAPTrack's web icon is matched to its iPhone app for the same reason. `make_favicon.py` is a **port of `claude-lottery-ios/scripts/make_icon.py`** and deliberately keeps the SAME 108x108 viewport the Android vectors use, so the two scripts read side by side — which is why this app's SVG viewBox is 108 where the rest of the family draws in 64. **If the native icon's SHAPES change, change this with them** (and vice versa: the three are one drawing in three places). The mark exists twice on the web — the script (Pillow → `favicon.ico`) and the inline SVG data URI in each page's `<head>` — and those two must stay the same picture: the SVG is what a browser shows in the tab, the `.ico` is the fallback it fetches from the site root on its own and what each header `<img>` wears. Two things the SVG does that the native icon doesn't need: the numeral is the Android path with its group transform **already applied** (the script lists the same seven points), and the rounded corner is a **clip over the whole group**, not an `rx` on the backing rect — the corner glows overflow the tile on purpose and would otherwise square it off, which is exactly what the `.ico`'s alpha mask does at the end. iOS needs neither, because it applies its own corner mask. Re-running the script means bumping `?v=` on **every** `favicon.ico` reference — two per page, four in all — or the old icon stays cached for months. **The COLOUR is where the web deliberately parts company**, and that was asked for: the native ball is near-white (`--text-primary`) with a `--text-secondary` band at 45%, while this one wears the family's two accent tones — `#a5b4fc` body, `--accent` crescent — so it sits beside its siblings as one of a set. The crescent is FLAT, not translucent: the two accent tones are close together by design, so at the native 45% it all but vanished, where 45% of a far darker `--text-secondary` gave the white ball a clear one. The phone icons still wear the pale ball and are deliberately left alone — changing those means a new build and, for iOS, a new submission. Everything but `#a5b4fc` is a real theme-pack token (`--bg`, `--surface`, `--surface-alt`, `--accent`); that one is the lighter artwork tint every other mark in the family uses, copied rather than re-picked, so nothing new enters the pack. **The ball is also SCALED UP about its own centre** — one factor in `make_favicon.py` (`BALL_SCALE`), glows untouched, and every number in the SVG is that factor already applied, so recompute them from the script rather than by hand. A home-screen icon is looked at whole and can afford air around its subject; a favicon is 16px of tab furniture beside five siblings, and at the native radius the ball covered 48% of the tile against the family's 55-70% — it read as the small one in the row. At 34.5 it covers 64% and carries the same weight as Sprint Predictability's ring beside it. The numeral still softens to a mark at 16px, which is fine: the ring and the ball are what identify it there.
- **Chart.js is vendored as `chart.min.js`, never pasted into the page and never from a CDN.** Byte-identical to the copies in Flow Metrics, Money Map and Sprint Predictability — if one is ever updated, all four move together and `README.md`'s file table says the new version. It was inline on a single 200 KB line inside `lottery-portfolio.html` until 2026-08-21, and that cost three things worth remembering: the version was recorded nowhere, so nothing could tell you what was shipping; `paths-ignore: '**/chart.min.js'` in `codeql.yml` matched no file, so every scan re-reported the minifier's own redundant assignments and unreachable statements as findings **in this app's page** (30 of them, drowning anything real); and the library could not be cached separately from the page. `tests.html` pins the file, its version, and its position ahead of the app script.
- **Both pages' `csvCell()` carry the family's one CSV rule, and they are the same two
  lines.** A leading `'` goes on any cell opening with one of OWASP's six leads — `=` `+` `-`
  `@` TAB CR — unless the WHOLE cell is a number (`PLAIN_NUMBER`). The number carve-out is
  not optional decoration: `-` leads the risky set and both these tables are full of negative
  figures, so defusing on the first character alone would hand the spreadsheet a column of
  text. **Neither page has a free-text field today** — every cell is a fixed label or a
  rounded number — which is exactly why the guard went in before one exists. Flow Metrics,
  Golf Handicap, PAPTrack, Sprint Predictability and the starter carry the identical pair; a
  change belongs in all seven. `tests.html` runs the same cases against BOTH pages through
  one `csvCases()` factory, so the two can never drift from each other.
- **`package.json` is a Dependabot manifest, not a build step.** It installs nothing, declares nothing but the vendored `chart.min.js`, is `private: true` with no scripts, and CI passes `--omit=dev` so npm never downloads it. **Dependabot cannot re-vendor a file**, so a version-bump PR would raise the manifest while the app kept serving the old bytes — `tests.html` pins the manifest's pin to the version string inside the bundle, which makes a manifest-only bump fail and turns the PR into the right instruction: update the file too, in all four repos that carry it (lottery, team-dashboard, financial-plan, sprint-velocity). Never add a `scripts` block, and never let the pin become a `^` range — a range cannot be checked against a file.
- **A chart bar in the portfolio page is a tint fill plus a full-strength edge**, per rule 3 in the theme pack's CLAUDE.md: `tint()` mixes the series colour toward `--surface` and the colour itself goes on the outline. It's a drawing convention, not a palette change — no tokens involved, so it isn't drift. Two things deliberately stay solid, both tried the other way first and reverted: the **donut wedges** and the **8px legend swatches**, because those have to be told apart from each other and a tint compresses exactly that. (The reason used to be written as "a tint collapses the two violets and the two greens" — that described the five colours this page invented for itself, which are gone; the point survives the palette that prompted it, and the pack now gates the ramp at full strength for the same reason.) The **income waterfall** stays solid too — those are proportion-of-a-track meters, and an outline hides where the fill ends.
- **The portfolio's five asset colours come from the pack's categorical ramp** — `--series-1` through `--series-5`, read in numeric order (SPAXX, T-bills, Munis, VTI, VXUS) by `colors()` in `lottery-portfolio.html`. `colors()` is a **function, not a const**: `setTheme()` re-runs `render()`, so the values must be re-read from the document each pass or a theme switch keeps the previous theme's colours. Until 2026-08-21 this page carried five hex literals of its own — the only invented palette in the family — and two of them came out identical under deuteranopia (ΔE 0.7). **Tax drag is `--err` plus a diagonal stripe**, not a sixth series colour: on Light and Sepia `--err` is only ΔE 8.8–11.6 from `--series-5` (both the rust-red family), and the drag is stacked directly on the asset segment it subtracts from, so the hatch is what actually separates them. Same "never the fill alone" rule the pack states for status, and the same `stripes()` helper Money Map uses.
- **The calculator's winning-number balls wear official game branding, not theme tokens**: `.ball.pb` red `#b91c1c` (the Powerball) and `.ball.mb` gold `#d4a017` (the Mega Ball). Deliberate, AA-passing, and never paired red-vs-green: they are a third party's brand, not this app's palette, so they are not drift and must not migrate to the pack. **The portfolio's series colours used to be excused the same way and that was wrong** — they were this app's own invented palette, two of them (`#378ADD` and `#7F77DD`) simulating to the same colour under deuteranopia, and they moved into the pack as `--series-1`…`--series-5` on 2026-08-21. A brand colour someone else owns and a palette we picked ourselves are not the same case.
- `worker.js` is the Cloudflare Worker source for the jackpot CORS proxy (live at `lottery-proxy.charlie-adams-176.workers.dev`). **Editing it here does NOT update the live Worker** — deployment requires `wrangler deploy` or the Cloudflare dashboard, which the user runs, not Claude. Flag it clearly whenever this file changes.
- The worker scrapes usamega.com (fallback: lotteryusa.com), restricts CORS to `https://eagleadams86.github.io`, and returns `{pb, mm}`.
- After changes: **browser-test locally first**, then commit, push, verify the Pages deploy built, and spot-check the live pages. To serve locally, use whatever your environment provides: the desktop app's preview pane reads `.claude/launch.json` (port 8010); otherwise run `python3 -m http.server 8010` in this folder and drive a browser with whatever automation is available (e.g. Playwright). Don't spend time hunting for a specific tool — any local server + browser works. Caveat: the jackpot proxy only allows the live GitHub Pages origin, so jackpot data won't load from localhost — verify that feature on the live site. Keep README.md current.

- **`tests.html` pins the pure functions in both pages — open it (same local server, `http://localhost:8010/tests.html`) and check "All N tests pass" whenever you touch `tax.js`, the calculator's `parseField`/`ball`/`fmtDrawDate`/`gameBlock`/`pbBlock`/`mmBlock`/`winnersValue`/`nextDraw`/`taxBreakdown`/`annuityBreakdown`/`readShare`, or the portfolio's `computeIncome`/`portfolioRates`/`drawdown`/`readShare`/`parseLatest1yr`/`tint`/`posToM`/`mToPos`/`syncSlider` or the formatters.** It loads both real pages in hidden same-origin iframes and calls the functions directly (all plain `function` declarations, so no app-side hook is needed). Needs `http://localhost` — `file://` iframes are blocked in some browsers. The jackpot-proxy CORS error in the console while it runs is the documented localhost limitation, not a test failure. CI runs the same page headless on every push (`.github/workflows/tests.yml`) and fails the build if the summary goes red. When a rule pinned there changes, change the matching test in the same commit.
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
  cached (`./`, both pages, `theme.css`, `tax.js`, `chart.min.js`, `privacy.html`,
  `favicon.ico`, and the three install icons with the manifest).
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

## Chart text is on the ramp, and in the page's face (2026-08-30)

**`applyChartTextDefaults()` sets four Chart.js defaults before the four charts
are built: `color`, `borderColor`, `font.family` and `font.size = fsPx('xs')`.**
Sprint Predictability's block, ported the same day the family's tooltips were
swept.

This page already passed `font:{ size: fsPx('xs') }` to every axis it NAMES.
What that left behind were the two it does not name — **the tooltip and the
legend**, at Chart.js's built-in 12px — and all of them in Chart.js's built-in
Helvetica rather than the face the page is set in.

- **Set BEFORE the constructions**, inside `render()`'s `rebuild` branch: Chart.js
  copies the defaults into a chart at that moment and never looks at them again,
  and `rebuild` is also the branch a theme change goes down.
- The explicit `font:{ size }` on the axes is the same value and is left alone.
- `xs` is the chrome step — what ticks, legends and tooltips are family-wide.

## The chart tooltip wears the theme (2026-08-30)

**`tipTheme()` — six values, `Object.assign`ed under each of the four charts'
own tooltip options.** Chart.js's own bubble is a hard-coded 80%-black box with
white text: legible on Midnight, and the wrong object on Light and Sepia — a
slab of near-black over a paper-coloured card, the one thing on the page not
following the theme picker. Flow Metrics and Sprint Predictability have shipped
these values for a long time; ported here and to Money Map on 2026-08-30.

- **`--surface-alt` / `--text-primary` / `--text-secondary` / `--border-strong`,
  `borderWidth: 1`, `padding: 10`.** Sprint Predictability writes
  `--bg-card-alt`, which `theme.css` declares as an alias of `--surface-alt` in
  one place — the same colour under two names. No new colour is invented.
- **The theme is the BASE and each chart's own object goes over it**, so the
  `label` callback every one of these writes is never replaced. Losing it would
  leave a tooltip reading a bare figure with nothing saying which line it is.
- One function, four call sites: four copies of six values would be four places
  for the next palette change to be forgotten. The suite counts the call sites.
- Read when a chart is built, like `tc()` and `gc()` beside it — a theme change
  destroys and rebuilds all four (see `rebuild` in `render`).
- **Colour boxes stay on**, unlike Flow Metrics (mostly single-series): the
  drawdown lists three lines at once and the swatch ties each figure to its line.

## Hovering a chart (2026-08-30)

**The two LINE charts hover by column: `interaction: { mode: 'index',
intersect: false }`.** Money Map states the family rule — "a 3px point is a
target nobody should have to hit" — and both of these were on the Chart.js
default (`nearest` / `intersect: true`), which answers only when the pointer is
ON a point. `c3`'s points are 3px across; **`c4`'s are `pointRadius: 0`**, so its
tooltip could only be summoned by landing on something that is not drawn. Measured
before the change: a pointer between two points, or anywhere else in the column,
resolved to nothing at all.

Index mode also reads out EVERY line for that year rather than the nearest one,
which is the comparison both charts exist to make — weak against chosen against
strong, and the equity bucket against the total.

**`c1` (bars) and `c2` (the donut) keep the default, deliberately**: a bar and an
arc are their own targets, and index mode there would answer about a whole column
when the reader is pointing at one specific thing. The suite pins all four,
including the regression — that the old options resolved zero at the same point.

## One chart, filling the window (2026-08-30)

**Each of the portfolio's four chart cards carries a ⤢ button that lifts the card
into a fixed overlay filling the window under the header.** Flow Metrics' feature
(2026-08-21); Money Map, Sprint Predictability and the starter carry it too, so a
change to the behaviour belongs in all of them. It is NOT the Fullscreen API and
NOT a modal `<dialog>`: the phrase that shaped it is "with the menu still
visible", and both of those take the header away. `#chartMaxi` is an ordinary
fixed div at z-index 15 against the header's 20, starting at `--maxi-top` (the
header's MEASURED height) and outside `.app`, which goes `inert` while it is open.

**The card is MOVED, not copied.** A theme change destroys and rebuilds all four
charts into the same canvases; a second canvas up there would leave those redraws
painting the copy left on the page. A hidden `.chart-slot` holds the card's seat.
Nothing here rewrites the cards' markup, so unlike Money Map and Sprint
Predictability this needs no suspend/resume around a render — the buttons are
built once and only re-dressed. `syncMaxiButtons()` still runs at the end of
`render()` and from `toggleSection()`, because both change what is drawable.

Three things worth keeping:
- **The name is read while the card is at home, and remembered on it.** Two of
  the four cards have no heading of their own — the SECTION above them names them
  — and a maximised card has been moved out of that section, so `closest` finds
  nothing and the button said "Leave full screen — this chart" at the moment it
  most needed to say what you were looking at. `card.dataset.chartName`.
- **`.chart-max svg { pointer-events: none; }`** — pressing the button rewrites
  its own innerHTML to the arrows-in icon, which DETACHES whatever the pointer
  landed on, and a detached node answers null to every `closest()` a delegated
  handler further up asks. Money Map's card heading acted on that null and folded
  the card instead of filling the window.
- **`.chart-max[hidden] { display: none; }`** — `.chart-max` declares
  `display: flex`, and an author rule beats the browser's own
  `[hidden] { display: none }` whatever the specificities. **A test that asserts
  `btn.hidden` is deaf to this**: read the computed display.

## Stepping between charts in full screen (2026-09-03)

**A `‹` and a `›` beside the ⤢ walk the four charts without coming back down.**
Charles asked for it on 2026-09-03; built first in Flow Metrics and ported here
the same day, so a change belongs in both.

- **The arrows live in the OVERLAY, not in a card.** A step moves one card out
  and another in, and a button inside the card would be detached under the
  pointer mid-press — a detached button takes the keyboard's focus to `<body>`
  with it, so you could press Next once and have nothing left to press. This is
  the same trap as the icon rewrite above, reached from the other side.
- **`maxiCard()` reads `#chartMaxi > .chart-card`, not `firstElementChild`.**
  The overlay is no longer empty when nothing is up: it holds the arrows and the
  live region permanently.
- **The walk is this page's own answer to "that screen".** Flow Metrics walks a
  sub-tab; this page has no tabs, so it walks all four in laid-out order, minus
  any whose SECTION IS FOLDED — a folded section is a chart the reader has put
  away. It is read fresh on every press, so unfolding puts it straight back.
- **The card returns to its own seat before the next one leaves its own**, so the
  page never holds two `.chart-slot`s and the order the next walk is read from is
  the real one. Nothing else the overlay owns is touched by a step.
- **`.maxi-nav` is positioned from a sum that includes the card's 0.5px BORDER**
  (20 + 0.5 + 10 down; + 26 + 6 across), because an absolutely positioned box is
  offset from its containing block's *padding* box — `.chart-max`'s own `10px`
  therefore lands a border-width further in.

Its own `t()` with its own 1280x900 frame, so a walk that breaks does not take
the assertions about getting up there down with it.

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
