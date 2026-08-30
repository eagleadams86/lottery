# NY Lottery Take-Home Calculator & Portfolio

A pair of lightweight single-page web tools for calculating **real after-tax lottery winnings** for New York State residents, with live jackpot data and recent winning numbers pulled automatically.

- **Calculator:** [eagleadams86.github.io/lottery/ny-lottery-calculator.html](https://eagleadams86.github.io/lottery/ny-lottery-calculator.html)
- **Portfolio:** [eagleadams86.github.io/lottery/lottery-portfolio.html](https://eagleadams86.github.io/lottery/lottery-portfolio.html)

---

**Why there is a `package.json` in a repo with no build step.** It is not a package and it
installs nothing — it exists so Dependabot has a manifest to scan. Its only entry is the
Chart.js that is *vendored* as `chart.min.js` beside the app, pinned exactly, and CI passes
`--omit=dev` so npm never downloads it. Dependabot cannot re-vendor a file, so a version-bump
PR would otherwise raise the manifest while the app went on serving the old bytes; a test pins
the two to the same version, which makes a manifest-only bump fail and turns the PR into the
right instruction — update the file too, in all four repos that carry it.

## Files

| File | Description |
|------|-------------|
| `index.html` | The landing page at [eagleadams86.github.io/lottery/](https://eagleadams86.github.io/lottery/) — links to both tools. It exists so GitHub Pages serves *our* page there; without it Pages rendered this README instead, on a page with no Content-Security-Policy that pulled a script from a CDN. `.nojekyll` beside it turns that rendering off for good. |
| `sw.js` | Service worker: keeps both pages, the stylesheet, the icons and the install manifest on your device so they open offline. Never caches a jackpot, a winning number or a yield — those are live figures, and a stale one is a wrong answer. |
| `sw-kill.js` | The escape hatch — copy it over `sw.js` and push to uninstall every installed worker. |
| `ny-lottery-calculator.html` | After-tax lottery take-home calculator with live jackpots and winning numbers |
| `lottery-portfolio.html` | What-if model of investing the lump sum as a tax-aware portfolio |
| `chart.min.js` | Chart.js 4.4.1, vendored (no CDN) — byte-identical to the copies in Flow Metrics, Money Map and Sprint Predictability. Third-party: never hand-edit it, and if it is ever updated, update all four and this table together |
| `tax.js` | The tax engine both pages share — the 2026 federal, New York, NYC and Yonkers rate tables, the bracket maths, New York's tax-benefit recapture, and the annuity schedules. One file rather than two copies of the same tax law, because rates move every year and a page that missed the edit would go on quoting last year's answer with no sign anything was wrong |
| `theme.css` | Shared color tokens + 4 theme palettes, linked by both pages. Generated in the claude-theme-pack repo (the source of truth for all apps); every color pair is script-verified to meet WCAG AA contrast, and the portfolio's five asset colours come from its categorical `--series-*` ramp |
| `favicon.ico` | The icon all three pages share — the fallback a browser fetches from the site root on its own |
| `manifest.webmanifest` | The install manifest — what makes Chrome and Edge offer "Install app" on a Mac or a PC. One for the whole site, not one per page: both tools wear the same mark, so two installs would be two identical icons in the Dock. It installs the pair, opening on the landing page, and its **shortcuts** put either tool one right-click away on the icon |
| `icon-192.png`, `icon-512.png`, `icon-512-maskable.png` | The install icons the manifest names. The first two are rounded (nothing masks a `purpose: any` icon); the maskable one is the same drawing with square corners, because a launcher crops it to its own outline |
| `make_favicon.py` | Draws `favicon.ico` to match the inline SVG icon in the pages, and the three install icons above, from the one drawing |
| `worker.js` | Cloudflare Worker source for the jackpot CORS proxy (deployed separately at `lottery-proxy.charlie-adams-176.workers.dev`) |
| `tests.html` | Dev-only test page pinning both pages' pure functions (input parsing, feed validation, tax/allocation math, formatters); run by CI on every push |
| `privacy.html` | Privacy policy for both pages — what is kept in the browser, and the three public feeds they read |

Both pages carry a **How it works** link at the foot, back to this README on GitHub — the
repo front page renders it, and it is where the tax and allocation assumptions are spelled out.

## Working Offline

Both pages keep a copy of themselves on your device, so they open with no network at all —
the tax maths and the portfolio model are pure calculation and work exactly the same. The
live data — current jackpots, the latest winning numbers and the Treasury yield — is never
part of that offline copy: the service worker deliberately refuses to cache the three
feeds, because a jackpot from last week silently presented as this week's would be a wrong
answer, not an old page. Each page does keep the last figures it fetched in `localStorage`
for up to six hours (so repeat visits don't re-query the feeds, and a failed refresh can
fall back to them **labelled as earlier figures**) — which means shortly after a visit an
offline page may still show those recent figures with their date, and past the six hours
you get its ordinary "couldn't load, enter it yourself" state.

What's kept is only the two pages, the landing page, the privacy policy, the stylesheet, the
tax tables and the icon: files already public in this repo, and nothing else. **Nothing you type is ever put
there.** That matters because every one of these apps shares a single browser origin, so
that cache is not private to this repo.

The network is always tried **first**, and the stored copy is used only when it genuinely
doesn't answer (or takes more than five seconds), so you can't be left on an old version
while you're online. Unlike the sibling apps there is no "saved by a newer version" check
here, and deliberately: these pages save nothing but preferences and cached feed data, so
stale code has nothing of yours to damage. `tests.html` pins that reasoning — it fails if a
new stored key appears that isn't a preference or a cache.

`sw-kill.js` sits in the repo unused, as an escape hatch: copying it over `sw.js` and pushing
makes every installed copy uninstall itself and go back to being ordinary online-only pages.

**The icon is the native apps' ball, in the app family's blue** — the numbered ball from
[lottery-ios](https://github.com/eagleadams86/lottery-ios) and
[lottery-android](https://github.com/eagleadams86/lottery-android), on the midnight field with
its two drifting corner glows, recoloured to the accent every one of my apps shares. Both
pages show it beside their title and in the browser tab, so the web and the phone apps read as
one product while the tab still sits with its siblings. `make_favicon.py` is a port of the iOS
repo's `scripts/make_icon.py`, in the same 108×108 viewport the Android vectors use, and it
keeps `favicon.ico` and the pages' inline SVG the same picture rather than leaving a binary
nobody can review in a diff. If the native icon's shapes ever change, change this with them —
colour and size are the two places the web deliberately differs. The ball is drawn larger
here than the phone icons draw it, so it carries the same weight as the other apps' marks at
favicon size; that is one scale factor in the script, and the SVG's numbers come from it.
Re-run with `python3 make_favicon.py`, then bump the `?v=` on every `favicon.ico`
reference — browsers hold on to an icon for a long time.

Native mobile ports have shipped and their build plans now live in their own (private) repos:

- **iOS:** [lottery-ios](https://github.com/eagleadams86/lottery-ios) (calculator only)
- **Android:** [lottery-android](https://github.com/eagleadams86/lottery-android) (calculator only)

---

## Features

### Both pages

- **Install it like an app** — on a Mac or a PC, open the site in Chrome or Edge and choose "Install NY Lottery". It gets its own window with no browser chrome and its own icon in the Dock or on the taskbar, opening on the two-card landing page; right-click that icon and you can jump straight to either tool. On an iPhone or iPad, Safari's Share ▸ "Add to Home Screen" does the same
- **Split down the middle on a laptop** — from 1000px up, the calculator becomes two equal columns: what you're telling the page on the left (the jackpots, the amounts, the payout and filing controls, the headline tiles and the latest winning numbers), what it's telling you back on the right (the effective rate and the full tax breakdown). Below 1000px it stacks into one column in the same order, so nothing moves around on a phone
- **The app family's layout** — the same page width and the same header as [Sprint Predictability](https://github.com/eagleadams86/sprint-velocity), [Flow Metrics](https://github.com/eagleadams86/team-dashboard) and [PAPTrack](https://github.com/eagleadams86/paptrack). The header is a bar across the top that **stays put as you scroll**, so the theme picker and the link to the other page are always a click away rather than somewhere above the first card
- **The theme picker is written out at its final size, with Auto pre-selected.** Both pages built its four options from script at the *foot* of the file, into an empty `<select>` in a header that had already painted — so the control laid out at about 40px and jumped to its full width a moment later, on every load. The options live in the markup now and `THEMES` is read back off them, which is the rule every sibling app follows and the one place the four ids live. Fixed 2026-08-21 and pinned in `tests.html`
- **The landing page is a real `<main>` / `<footer>` pair too.** Both tools and the privacy policy had the landmarks from 2026-08-20; the launcher was still a `<div>` of prose with a styled `<p>` at the foot. `</main>` closes before the `<footer>`, because a `<footer>` nested inside `main` is not contentinfo at all
- **Wider, and actually using it** — the portfolio's holdings table and charts have the room they always wanted, and the calculator splits in two on a laptop screen: what it's asking of you on the left (jackpots, amounts, how many winners, the latest draw) and what it tells you back on the right (your share, tax, take-home). On a phone both pages stack exactly as they always did
- **Keyboard and screen-reader landmarks** — a skip link straight to the content, and real `main` and `footer` regions to jump between
- **Share what's on screen** — the `↗ Share` button in the header turns the figures into a link, with the numbers carried *inside the link itself*: nothing is uploaded and no copy is kept, so there is also no way to withdraw one once sent. The window is the same one [Sprint Predictability](https://github.com/eagleadams86/sprint-velocity), [Flow Metrics](https://github.com/eagleadams86/team-dashboard), Money Map and Golf Handicap open — same width, same panel, same *Copy link / Preview it / Done* — with one difference stated in it: these links are **not** read-only, because a lottery scenario is something you want the other person to play with. Opening someone else's link is deliberately **a look, not a save** — the page says at the top where the figures came from, saves none of them for the whole visit, and *Back to mine* returns you to your own settings exactly as you left them. Pasting a link into a tab already showing the page works too, which is the way most people will actually open one
- **Copy As CSV, and print** — every figure on screen as two clipboard-ready columns (the annuity's full payment schedule included, and the portfolio's forty-year path), and a print stylesheet that drops the header, the buttons and the chrome, opens every collapsed section and puts the two columns into one. **Whatever theme you work in, it comes off the printer on a light one** — including the portfolio's four charts, which are redrawn for paper rather than just re-styled: a chart is painted onto a canvas once, so a stylesheet alone cannot reach it and a dark chart would otherwise land on a light page
- **One tax engine for both pages** — the rate tables and the bracket maths live in `tax.js`, loaded by both. They used to be written down twice, once per page, which is how one of them ends up a year out of date

### Lottery Portfolio

Targeted at **Niagara County, NY residents** (outside NYC/Yonkers) who want to model what a lottery lump-sum would actually look like as a managed investment portfolio.

- **Info dots on the three sections that cannot show their working** — a circled **i** beside **Assumptions**, **Summary** and **Portfolio Breakdown** opens the same help window the rest of the family uses. Three and no more, on purpose: the two projections at the foot each carry a paragraph of prose already, and the waterfall is the breakdown's arithmetic totalled up. What they explain is the part the numbers can't say themselves — that the take-home figure has already been through lottery tax and is not the jackpot; that SPAXX is pinned at 4.3% with no slider while the T-bill yield is the Treasury's own published rate; that the ladder is sized off your *spending*, not the pot, which is why a huge portfolio still shows a fraction of a percent in cash; and that the five holdings meet three different tax regimes at once, with the dividend bands stacked on top of the interest, so the rate in each row is an average rather than a bracket
- **Interactive sliders with editable values** — adjust take-home amount, annual spending, inflation, T-bill yield, muni yield, VTI/VXUS dividend yields, equity growth rate, and VTI/VXUS split; click any displayed value to type a number directly. The money boxes understand unit suffixes (`5M`, `1.5B`, `125K`) as well as bare numbers, and anything unreadable snaps back to the current value rather than being silently misread
- **Take-home runs from $100K to $500M on a log scale** — each 10x takes up the same length of track, so a modest win or a split share (nine winners on a $20M jackpot is about $500K each) is as easy to dial in by dragging as a record jackpot. On a linear track the $500M top end made everything under roughly $1.5M unreachable
- **Spending-driven allocation model** — the cash/bond buckets scale with annual spending (SPAXX = 1 year of spending, T-bills = 3 years, NY Munis = 4 years) and everything left over goes into equities at the chosen VTI/VXUS split. When spending is high relative to the portfolio (above 1/8 of it) the full 8-year ladder no longer fits, so all three buckets are scaled down proportionally and a note explains why — allocations always add up to exactly the portfolio total, never more
- **Live T-bill yield** — the T-bill yield slider auto-fills from the US Treasury's daily par yield curve (1-year maturity), fetched on page load with an "as of" date shown next to the label; cached in `localStorage` for 6 hours so repeat visits don't re-query the Treasury feed; falls back to the default if the feed is unreachable, and can still be dragged to override
- **Holdings breakdown table** — shows each holding (SPAXX, T-bills, Munis, VTI, VXUS), its allocation, percentage of portfolio, gross income, tax treatment, and after-tax income
- **Summary metrics** — key portfolio-level numbers computed live from slider inputs; click the **Surplus vs spending** tile to raise annual spending to your after-tax income, zeroing the surplus (iterates to a fixed point since the cash/bond buckets scale with spending)
- **Income waterfall** — visual breakdown of gross income to after-tax income across all holdings
- **Charts** — stacked bar (income by holding with tax drag overlay), donut (portfolio allocation), a line chart of the 10-year equity growth projection, and the forty-year drawdown with its three growth lines
- **Tax worked out from the brackets, not assumed** — until 2026-08-22 this page applied four flat top-marginal rates (37% federal, 10.9% NY, 20% LTCG, 3.8% NIIT) to any portfolio at all. That is right at $100M and badly wrong at the $500K the take-home slider can reach: a $2M portfolio pays about **4.7%** on its dividends, not 34.7%. Interest now walks up the 2026 federal brackets from the bottom after the standard deduction; qualified dividends are taxed in the capital-gain bands **stacked above** that interest, so a bond-heavy portfolio pays more on its dividends than an equity-heavy one of the same size; NIIT is spread across everything taxable rather than charged to the dividends alone; T-bill interest is still exempt from New York and muni interest from both. The rate beside each holding in the breakdown table is the rate that holding actually pays
- **Filing status, and which town** — single or married filing jointly, and New York State, New York City or Yonkers. Both are shared with the calculator page under the same settings, so answering on one answers on the other
- **Does it last?** — the question the rest of the page sets up and never answered. Forty years of the same model, one year at a time: spending rises with inflation (its own slider), income after tax is taken as cash, and shares are **sold** to cover whatever is left — plus the capital-gains tax on the sale, which this page ignored entirely before. The cost basis is tracked as a fraction and falls every year the market rises, so a sale in year thirty is taxed harder than one in year two. The verdict is a sentence: it outlasts forty years and ends at *this much*, or it runs out in year *N* — and it says whether three points more growth would have changed that, because often it wouldn't and the gap is spending
- **Three lines, not one** — the drawdown chart shows your growth rate with the same run three points either side. Forty years is not a number anyone should be handed to one decimal place. It is a stated spread, not a confidence interval, and the note under the chart says so
- **Themes** — dropdown in the upper right with the four themes plus Auto, listed alphabetically (Auto, Dark, Light, Midnight, Sepia); **defaults to Auto**, which follows the reader's own system — Light on a light one, Midnight on a dark one — and changes with it while the page is open, no reload and no script. Preference saved in `localStorage`. Charts adapt their axis/grid colors per theme, and the bars adapt their fills: a bar's area is a tint of its series colour mixed toward the card behind it, with the full-strength colour on the outline. That's the shared convention across these apps (it lives in the theme pack's rules) — a solid fill has to be dark to clear the contrast rules on the Light and Sepia cards, and five dark bars side by side read as slabs of near-black on a pale page. The donut and the small legend swatches deliberately stay solid: their job is telling several colours apart from each other, which a tint compresses. The five asset colours are the theme pack's categorical ramp (`--series-1`…`--series-5`), which is gated so that no two of them can look alike to a red-green colourblind reader — all ten pairs are held ΔE 18 apart under both deuteranopia and protanopia. Tax drag is the theme's error colour *plus a diagonal stripe*, because on the light themes that red is too close to the VXUS colour it sits on top of, and a stripe is a channel colour vision doesn't affect
- **Any chart fills the window** — each of the four carries a ⤢ button in its top-right corner; press it and that chart alone fills the screen under the header. **The header stays where it is and stays usable**: change the theme and the chart redraws in front of you, still full screen. Escape, the same button (now an arrows-in icon), or a click on the margin round the card brings it back down, and the page is where you left it. It is the same feature, and the same behaviour, as in Flow Metrics, Sprint Predictability and Money Map
- **Collapsible sections** — every section (Assumptions, Summary, Portfolio breakdown, Income waterfall, Charts, 10-year growth projection, Does it last?) can be collapsed from its header, by mouse or keyboard; open/closed state is remembered across visits via `localStorage`
- **Remembers your settings** — slider values, filing status and residence restored on revisit via `localStorage`. The take-home slider is seeded from the calculator's net take-home, but only when the calculator has produced a *new* figure; if you move that slider yourself it stays where you put it
- **Mobile-friendly** — portfolio breakdown table reflows to a card layout on narrow screens
- **Cross-page navigation** — button to jump directly to the calculator
- **No build step** — plain HTML/CSS/JS, no dependencies beyond Chart.js 4.4.1, vendored as `chart.min.js` beside the page (no CDN, never hand-edited); shares `theme.css` with the calculator for a unified palette

---

### NY Lottery Calculator
- **Live jackpot data** — auto-fetches current Powerball and Mega Millions jackpots from `usamega.com` (with `lotteryusa.com` as fallback), via a Cloudflare Worker proxy
- **Cached for 6 hours** — fetched jackpots are stored in `localStorage`; page loads/refreshes within 6 hours render instantly from the cache without re-scraping. The **Refresh** button always forces a live fetch (e.g. right after a draw) — and also force-refreshes the winning numbers when that section is open. Caps redundant scraping from repeated visits on a device
- **Next draw dates** — shows upcoming draw date for each game (Powerball: Mon/Wed/Sat, Mega Millions: Tue/Fri), computed client-side in ET
- **Latest winning numbers, for six New York games** — Powerball, Mega Millions, NY Lotto, Take 5, Pick 10 and Millionaire for Life, from NY's open data portal (`data.ny.gov`). Only the game you are looking at is fetched, and only when you look at it. Take 5 draws twice a day and shows both; Pick 10 draws twenty numbers and wraps them. Cash 4 Life is deliberately absent — the game is retired and its dataset is frozen, so it would have shown a February draw as "the latest results" for ever. Color-coded balls (red Powerball, gold Mega Ball) and the Power Play multiplier; the two jackpot cards at the top move this row with them, but not the other way round — picking Pick 10 says nothing about which jackpot you are calculating on. Expanded by default; open/closed state remembered via `localStorage`, so collapsing it sticks across visits. Results are cached in `localStorage` for 6 hours, so reopening the section within that window renders instantly without re-querying the API; the top **Refresh** button force-pulls fresh results when the section is open
- **Lump sum, annuity, or the two side by side** — the page answered only the lump-sum half of the actual decision until 2026-08-22. The annuity is modelled properly: 30 payments each 5% larger than the last for Powerball and Mega Millions, 26 equal ones for NY Lotto, with the payment-by-payment schedule and the tax on each year. **Compare** puts them together, discounts the annuity to today's money at a rate you choose, and names the rate at which the two are level — below it the annuity wins, above it the lump sum does. The annuity is often ahead on tax alone, because thirty tax returns each start at the bottom of the brackets where one does not
- **Tax worked out from the brackets, not assumed** — the page applied a flat 37% federal and 10.9% state rate to any amount, which is right for a jackpot and wrong for everything smaller. A $500,000 share came out taxed at 47.9% when the real figure is about 34.5%. Federal tax is now worked out on the 2026 brackets after the standard deduction, and New York on its 2026 brackets **with the tax-benefit recapture** that flattens a large prize to a single rate — so a $100M jackpot still comes out at 47.9% and a smaller share comes out at what it really costs
- **Refunds, which the old model could not produce** — New York withholds at 10.9% by law whatever you end up owing, so a smaller prize is *over*-withheld and the money comes back at filing. The breakdown says so in as many words, and the heading above it changes with the sign
- **Filing status, and which town** — single or married filing jointly, and New York State, New York City or Yonkers. NYC charges its own tax on top and Yonkers a 16.75% surcharge on your state tax; neither is withheld from a prize, so both are always a bill at filing. The page assumed a single filer outside both cities for its whole life before this, which excluded about 40% of New York's population
- **Nothing withheld below $5,000** — split a prize far enough and every share falls under the federal withholding floor, so nothing is taken at source at all. The old flat model withheld 34.9% of every share no matter how small
- **Full NY tax breakdown, open by default** — what was withheld at payment against what is actually owed, with the gap settled (either way) at filing
- **Split among winners** — supports dividing the jackpot among multiple people (1–1000, clamped on both typed and stepped input)
- **Shorthand input** — accepts `325M`, `1.2B`, etc. An amount that can't be read is called out under the box instead of being silently ignored
- **Themes** — dropdown in the upper right with the four themes plus Auto, listed alphabetically (Auto, Dark, Light, Midnight, Sepia); **defaults to Auto**, which follows the reader's own system — Light on a light one, Midnight on a dark one. Preference saved in `localStorage` and shared with the portfolio page
- **Collapsible tax tables** — detailed breakdown hidden by default, expandable on demand
- **The discount rate appears on Compare and nowhere else** — it is the number that decides which payout is ahead, and Compare is the only view that discounts anything. It used to show on the Annuity tab too, where the tiles and the schedule are all undiscounted, so typing in it changed nothing you could see
- **On Compare the working follows the answer** — the effective tax rate, the whole tax breakdown and the payment schedule describe whichever payout is **Ahead here** (the schedule simply isn't there when the lump sum wins — thirty rows of annuity payments under a verdict recommending the lump sum was the page arguing with itself), and change over with it the moment the discount rate crosses the break-even. Both say which payout they are about, because the two cards each carry their own rate. They used to be the lump sum's always, so on the tab whose job is to pick a winner the arithmetic underneath could belong to the one that lost. *(One breakdown, not two side by side: the lump sum's describes the whole prize and the annuity's describes one of thirty payments, so in adjacent columns they would invite comparing $300M against $7.5M. The comparable figures — after tax, and in today's money — are already on the cards.)*
- **Help where the page assumes knowledge** — a small circled **i** beside the discount rate, the effective tax rate and each of the two tax stages opens a plain-English explanation, the same affordance every app in the family carries. *(It drew a **?** until 2026-08-23, as did Golf Handicap, while three other apps drew an "i" — one control with two faces. "i" won: "?" is the glyph a browser already puts on its own help cursor and in a form's validation bubble, and it asks a question where this thing answers one.)* The discount-rate one is the reason it exists: the page recommends a payout on the strength of that number, and nothing on screen said what it was. It explains which way the rate pushes the answer, and that you don't have to pick the right one — Compare names the rate at which the two payouts are level, so all you decide is which side of it you're on
- **Every section opens expanded** — the tax breakdown, the winning numbers and the payment schedule. The schedule was collapsed until 2026-08-22, which made the thirty figures an annuity actually consists of something you had to know to ask for. Close any of them and it stays closed on your next visit
- **Remembers your settings** — game selection, winner count, payout choice, filing status, residence, discount rate, and which sections you've collapsed, all restored on revisit
- **Feeds the portfolio** — net take-home is saved to `localStorage` and used to pre-fill the portfolio's take-home slider
- **Cross-page navigation** — button to jump directly to the portfolio
- **iOS compatible** — tested for mobile Safari quirks

---

---

## Accessibility

Both pages are built to meet WCAG 2.1 AA:

- **Contrast** — every text color clears 4.5:1 against the page, card and alt-card backgrounds, in all 4 themes. The four text greys are deliberately tiered (primary > secondary > muted > hint) so the visual hierarchy survives; `--text-hint` is the floor at 4.5:1
- **Keyboard operable** — every control, including the portfolio's collapsible section headers and the clickable *Surplus vs spending* tile, is a real `<button>` reachable by Tab and activated with Enter/Space. Focus is always visible: a 2px `--focus-border` ring, offset from the control, on every focusable thing on both pages. The calculator's three input boxes were the exception until 2026-08-26 — `outline: none` on their base rules out-specified the page's own `:focus-visible` rule, leaving only a 1.5px underline changing colour at 1.48:1 between states, where WCAG 2.2 SC 2.4.11 asks for a 2px perimeter at 3:1. The ring is now restated at a specificity that wins, and `tests.html` focuses each box and measures the ring that actually paints
- **Screen readers** — section headers are `<h2>`-wrapped buttons carrying `aria-expanded`, so the page has a navigable heading outline and announces open/closed state. The game selector uses `aria-pressed` (selection isn't signalled by color alone), async status messages and the recalculated take-home are `role="status"` live regions, and decorative chevrons/spinners are hidden from assistive tech
- **Reduced motion** — a reader who has switched on their system's *Reduce Motion* setting gets no animation from either page. That matters most on the calculator, whose "looking up jackpots" and "loading latest results" indicators are a spinner rotating forever; it is the only endless animation in the family. Honoured from `theme.css` since 2026-08-26 (pack rule 15) rather than per page
- **Zoom** — neither page restricts pinch-zoom

---

## Security

- **Content Security Policy** — every page declares a CSP via `<meta>` (GitHub Pages can't set response headers), including `tests.html`, which Pages publishes beside the apps. `connect-src` pins network access to only the feeds each page uses, and `default-src 'none'` / `base-uri 'none'` / `form-action 'none'` close off the rest. `'unsafe-inline'` for script and style is unavoidable given the no-build-step single-file design, so the policy is defence in depth rather than full XSS protection. `frame-ancestors` can't be set from a meta tag and would need a real header
- **Untrusted feed data** — winning numbers from `data.ny.gov` are validated before rendering: ball numbers must match `\d{1,2}`, the multiplier is coerced with `parseInt`, and draw dates must match `YYYY-MM-DD`; anything else is dropped. The CI-scorecard line on `tests.html` (the one place the GitHub API is still read, since the Recent-changes boxes were removed) only renders a link when the API hands back a real `https://github.com/` address
- **Jackpot proxy** — the Worker restricts CORS to the GitHub Pages origin. Note this only stops other *websites* using it; `Origin` is set by the browser, so a scripted client can still call it directly
- **Copy As CSV defuses spreadsheet formulas** — a cell beginning `=`, `+`, `-` or `@` is read as a *formula* by Excel and Numbers, so every cell is prefixed with an apostrophe before it goes to the clipboard (invisible in the sheet). Neither page has a free-text field today — every value is a fixed label or a rounded number — so this is the guard being in place before one exists, matching the other apps in the family. Plain numbers are exempt, or every negative figure would arrive as text

---

## Architecture

```
GitHub Pages (static hosting)
    ├── tax.js ───────────────── the rate tables and bracket maths, loaded by both pages
    ├── ny-lottery-calculator.html
    │       ├── jackpots ──────► Cloudflare Worker (CORS proxy)
    │       │                    lottery-proxy.charlie-adams-176.workers.dev
    │       │                        └── scrapes usamega.com
    │       │                            (mobile Safari user-agent spoof)
    │       │                            fallback: lotteryusa.com
    │       └── winning numbers ─► data.ny.gov open-data API (direct, CORS)
    │                              six games, one dataset each, fetched on demand
    └── lottery-portfolio.html
            └── 1-yr T-bill yield ─► home.treasury.gov daily par yield XML (direct, CORS)

All three feeds are cached in localStorage for 6 hours per device. Share links carry their
figures inside the URL fragment and touch no network at all.
```

---

## Tax Math

All figures are estimates for **tax year 2026**, worked out on the assumption that the prize
or the portfolio is your only income for the year, with the standard deduction and no credits.
A salary on top pushes you further up the same brackets, so every figure here is a floor.
The tables and the maths live in one file, `tax.js`, shared by both pages.

### Where the rates come from

| Tax | Basis |
|-----|-------|
| Federal income tax | The 2026 brackets — 10% to 37% — from [IRS Rev. Proc. 2025-32](https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill), after the standard deduction ($16,100 single / $32,200 married filing jointly) |
| New York State | The 2026 brackets, 3.9% to 10.9%. The bottom five rates are 0.1 point lower than 2025's; the top bands are the temporary high-earner brackets, extended through 2032 |
| New York's tax-benefit recapture | Above $107,650 of New York income the state claws back the benefit of the lower brackets, phased in over the $50,000 above each threshold, until the whole of your taxable income is taxed at the top rate you reached. Over $25M the statute says so outright, which is why a jackpot pays a flat 10.9% ([Tax Law §601](https://www.nysenate.gov/legislation/laws/TAX/601)) |
| New York City | Resident rates 3.078% to 3.876%, on top of the state — and never withheld from a prize |
| Yonkers | A surcharge of 16.75% of your net state tax, likewise never withheld |
| Long-term capital gains | The 2026 bands (0% / 15% / 20%), measured from the top of your ordinary income rather than from zero |
| Net investment income tax | 3.8% above $200,000 single / $250,000 jointly — a threshold that is **not** indexed |

The recapture is modelled as that general rule rather than as the six per-status worksheets
New York prints, because the worksheets are re-issued every year and the rule they implement
is stable. It is exact at the top band — the case this app exists for — and never lower than
the plain bracket sum, so it cannot flatter the answer.

### Withholding is not the same as what you owe

| Withheld at payment | Rate |
|-----|-----|
| Federal | 24%, on any prize of $5,000 or more |
| New York State | 10.9% — by law the state's **highest effective rate** ([20 NYCRR 171.11](https://www.law.cornell.edu/regulations/new-york/20-NYCRR-171.11), [Publication 140-W](https://www.tax.ny.gov/pdf/publications/income/pub140w.pdf)), whatever you actually end up owing |
| New York City / Yonkers | Nothing. Both are settled entirely at filing |

That asymmetry is the whole reason the calculator shows two figures rather than one. On a
jackpot you owe more at filing than was taken; on a smaller prize you owe less, and the
difference comes back as a refund.

### The annuity

Powerball and Mega Millions both pay an advertised jackpot as **30 payments** — one
immediately and 29 a year apart — each **5% larger** than the one before. New York Lotto pays
**26 equal** ones. The first payment is therefore not the jackpot divided by 30: it is the
jackpot divided by the sum of the growth factors, which for 30 payments at 5% is 66.44.

Each payment is its own tax year, so each one starts at the bottom of the brackets. That is
why the annuity's effective rate comes out lower than the lump sum's, and it is half of the
argument between them; the other half is that a dollar in 2055 is not a dollar today, which
is what the discount rate is for. Future payments are taxed on **today's** brackets — nobody
knows 2055's table, and assuming this year's is the honest choice rather than a hidden one.

### Investment income (portfolio)

| Holding | Tax treatment |
|---------|--------------|
| SPAXX (money market) | Federal ordinary income + NY |
| T-bills | Federal ordinary only — exempt from NY by federal statute |
| NY Munis | Exempt from both |
| VTI / VXUS dividends | Qualified: long-term gain bands + NIIT + NY ordinary |
| Selling shares to live on | Long-term gain federally, ordinary income to New York, on the gain portion only — which grows as the bucket does |

The rates each of those meets depend on how much the portfolio earns, so the breakdown table
shows the computed figure rather than a fixed one.

## Tests

`tests.html` loads both real pages in hidden same-origin iframes and calls their functions directly — no build step, no copies of the code under test. It pins the shared tax engine (the bracket tables, New York's recapture, the withholding floor, the annuity schedules and present value), the calculator's manual-amount parser, the six games' winning-numbers allowlist, and the winner-count clamp, plus the portfolio's allocation model (`computeIncome`), its forty-year drawdown, the Treasury feed parser, and the shared formatters. Both pages' share links are tested against deliberately hostile payloads: a hand-edited link cannot put a value anywhere it does not belong.

The frames and the source fetches share **one cache-buster per run**. Without it a browser will happily hand a frame a page it cached minutes ago — on 2026-08-22 the suite reported all-green against a portfolio page three features out of date, because the source-level tests were reading the file off the server while the frames ran yesterday's copy. A suite that can pass against a build which exists nowhere is worse than no suite.

Run it locally from a server (`python3 -m http.server 8010`, then open `http://localhost:8010/tests.html` — `file://` iframes are blocked in some browsers) and check the summary reads "All N tests pass". CI runs the same page headless on every push (`.github/workflows/tests.yml`) and fails the build if the summary goes red.

---

## Deployment

- **Hosting:** GitHub Pages (this repo, `main` branch)
- **Proxy:** Cloudflare Workers (free tier) — handles CORS and server-side scraping
- **No build step** — plain HTML/CSS/JS, no dependencies or bundler required; both pages share a single `theme.css` (generated in the claude-theme-pack repo) for color tokens and the four theme palettes, and the portfolio's charts use a vendored `chart.min.js` (Chart.js 4.4.1) rather than a CDN
