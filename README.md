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
right instruction — update the file too, in all three repos that carry it.

## Files

| File | Description |
|------|-------------|
| `index.html` | The landing page at [eagleadams86.github.io/lottery/](https://eagleadams86.github.io/lottery/) — links to both tools. It exists so GitHub Pages serves *our* page there; without it Pages rendered this README instead, on a page with no Content-Security-Policy that pulled a script from a CDN. `.nojekyll` beside it turns that rendering off for good. |
| `sw.js` | Service worker: keeps both pages, the stylesheet, the icons and the install manifest on your device so they open offline. Never caches a jackpot, a winning number or a yield — those are live figures, and a stale one is a wrong answer. |
| `sw-kill.js` | The escape hatch — copy it over `sw.js` and push to uninstall every installed worker. |
| `ny-lottery-calculator.html` | After-tax lottery take-home calculator with live jackpots and winning numbers |
| `lottery-portfolio.html` | What-if model of investing the lump sum as a tax-aware portfolio |
| `chart.min.js` | Chart.js 4.4.1, vendored (no CDN) — byte-identical to the copies in Flow Metrics and Money Map. Third-party: never hand-edit it, and if it is ever updated, update all three and this table together |
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

What's kept is only the two pages, the landing page, the privacy policy, the stylesheet and
the icon: files already public in this repo, and nothing else. **Nothing you type is ever put
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
- **The app family's layout** — the same page width and the same header as [Sprint Predictability](https://github.com/eagleadams86/sprint-velocity), [Flow Metrics](https://github.com/eagleadams86/team-dashboard) and [PAPTrack](https://github.com/eagleadams86/paptrack). The header is a bar across the top that **stays put as you scroll**, so the theme picker and the link to the other page are always a click away rather than somewhere above the first card
- **Wider, and actually using it** — the portfolio's holdings table and charts have the room they always wanted, and the calculator splits in two on a laptop screen: what it's asking of you on the left (jackpots, amounts, how many winners, the latest draw) and what it tells you back on the right (your share, tax, take-home). On a phone both pages stack exactly as they always did
- **Keyboard and screen-reader landmarks** — a skip link straight to the content, and real `main` and `footer` regions to jump between

### Lottery Portfolio

Targeted at **Niagara County, NY residents** (outside NYC/Yonkers) who want to model what a lottery lump-sum would actually look like as a managed investment portfolio.

- **Interactive sliders with editable values** — adjust take-home amount, annual spending, T-bill yield, muni yield, VTI/VXUS dividend yields, equity growth rate, and VTI/VXUS split; click any displayed value to type a number directly. The money boxes understand unit suffixes (`5M`, `1.5B`, `125K`) as well as bare numbers, and anything unreadable snaps back to the current value rather than being silently misread
- **Take-home runs from $100K to $500M on a log scale** — each 10x takes up the same length of track, so a modest win or a split share (nine winners on a $20M jackpot is about $500K each) is as easy to dial in by dragging as a record jackpot. On a linear track the $500M top end made everything under roughly $1.5M unreachable
- **Spending-driven allocation model** — the cash/bond buckets scale with annual spending (SPAXX = 1 year of spending, T-bills = 3 years, NY Munis = 4 years) and everything left over goes into equities at the chosen VTI/VXUS split. When spending is high relative to the portfolio (above 1/8 of it) the full 8-year ladder no longer fits, so all three buckets are scaled down proportionally and a note explains why — allocations always add up to exactly the portfolio total, never more
- **Live T-bill yield** — the T-bill yield slider auto-fills from the US Treasury's daily par yield curve (1-year maturity), fetched on page load with an "as of" date shown next to the label; cached in `localStorage` for 6 hours so repeat visits don't re-query the Treasury feed; falls back to the default if the feed is unreachable, and can still be dragged to override
- **Holdings breakdown table** — shows each holding (SPAXX, T-bills, Munis, VTI, VXUS), its allocation, percentage of portfolio, gross income, tax treatment, and after-tax income
- **Summary metrics** — key portfolio-level numbers computed live from slider inputs; click the **Surplus vs spending** tile to raise annual spending to your after-tax income, zeroing the surplus (iterates to a fixed point since the cash/bond buckets scale with spending)
- **Income waterfall** — visual breakdown of gross income to after-tax income across all holdings
- **Charts** — stacked bar (income by holding with tax drag overlay), donut (portfolio allocation), and line chart (10-year equity growth projection for VTI + VXUS vs. total portfolio)
- **Tax-aware math** — applies 37% federal, 10.9% NY State, 20% LTCG, and 3.8% NIIT rates depending on holding type
- **Themes** — dropdown in the upper right with 4 themes, listed alphabetically (Dark, Light, Midnight, Sepia); defaults to Midnight, preference saved in `localStorage`. Charts adapt their axis/grid colors per theme, and the bars adapt their fills: a bar's area is a tint of its series colour mixed toward the card behind it, with the full-strength colour on the outline. That's the shared convention across these apps (it lives in the theme pack's rules) — a solid fill has to be dark to clear the contrast rules on the Light and Sepia cards, and five dark bars side by side read as slabs of near-black on a pale page. The donut and the small legend swatches deliberately stay solid: their job is telling several colours apart from each other, which a tint compresses. The five asset colours are the theme pack's categorical ramp (`--series-1`…`--series-5`), which is gated so that no two of them can look alike to a red-green colourblind reader — all ten pairs are held ΔE 18 apart under both deuteranopia and protanopia. Tax drag is the theme's error colour *plus a diagonal stripe*, because on the light themes that red is too close to the VXUS colour it sits on top of, and a stripe is a channel colour vision doesn't affect
- **Collapsible sections** — every section (Assumptions, Summary, Portfolio breakdown, Income waterfall, Charts, 10-year growth projection) can be collapsed from its header, by mouse or keyboard; open/closed state is remembered across visits via `localStorage`
- **Remembers your settings** — slider values restored on revisit via `localStorage`. The take-home slider is seeded from the calculator's net take-home, but only when the calculator has produced a *new* figure; if you move that slider yourself it stays where you put it
- **Mobile-friendly** — portfolio breakdown table reflows to a card layout on narrow screens
- **Cross-page navigation** — button to jump directly to the calculator
- **No build step** — plain HTML/CSS/JS, no dependencies beyond Chart.js 4.4.1, vendored as `chart.min.js` beside the page (no CDN, never hand-edited); shares `theme.css` with the calculator for a unified palette

---

### NY Lottery Calculator
- **Live jackpot data** — auto-fetches current Powerball and Mega Millions jackpots from `usamega.com` (with `lotteryusa.com` as fallback), via a Cloudflare Worker proxy
- **Cached for 6 hours** — fetched jackpots are stored in `localStorage`; page loads/refreshes within 6 hours render instantly from the cache without re-scraping. The **Refresh** button always forces a live fetch (e.g. right after a draw) — and also force-refreshes the winning numbers when that section is open. Caps redundant scraping from repeated visits on a device
- **Next draw dates** — shows upcoming draw date for each game (Powerball: Mon/Wed/Sat, Mega Millions: Tue/Fri), computed client-side in ET
- **Latest winning numbers** — collapsible section showing the most recent draw results, fetched live from NY's open data portal (`data.ny.gov`); displays color-coded balls (red Powerball, gold Mega Ball) and the Power Play multiplier, and tracks the game selected at the top. Expanded by default; open/closed state remembered via `localStorage`, so collapsing it sticks across visits. Results are cached in `localStorage` for 6 hours, so reopening the section within that window renders instantly without re-querying the API; the top **Refresh** button force-pulls fresh results when the section is open
- **Lump-sum take-home** — computes the after-tax value of the cash option; if only the advertised (annuity) jackpot is entered, the cash value is estimated at 60%
- **Full NY tax breakdown, open by default** — federal withholding (24%), federal top marginal (37%), NY State withholding (10.9% — by law the state's highest rate, so the only top-up owed at filing is federal), and NY State top rate (10.9%); shows both withheld at payment and additional owed at filing
- **Split among winners** — supports dividing the jackpot among multiple people (1–1000, clamped on both typed and stepped input)
- **Shorthand input** — accepts `325M`, `1.2B`, etc. An amount that can't be read is called out under the box instead of being silently ignored
- **Themes** — dropdown in the upper right with 4 themes, listed alphabetically (Dark, Light, Midnight, Sepia); defaults to Midnight, preference saved in `localStorage` and shared with the portfolio page
- **Collapsible tax tables** — detailed breakdown hidden by default, expandable on demand
- **Remembers your settings** — game selection, winner count, and tax breakdown state all restored on revisit
- **Feeds the portfolio** — net take-home is saved to `localStorage` and used to pre-fill the portfolio's take-home slider
- **Cross-page navigation** — button to jump directly to the portfolio
- **iOS compatible** — tested for mobile Safari quirks

---

---

## Accessibility

Both pages are built to meet WCAG 2.1 AA:

- **Contrast** — every text color clears 4.5:1 against the page, card and alt-card backgrounds, in all 4 themes. The four text greys are deliberately tiered (primary > secondary > muted > hint) so the visual hierarchy survives; `--text-hint` is the floor at 4.5:1
- **Keyboard operable** — every control, including the portfolio's collapsible section headers and the clickable *Surplus vs spending* tile, is a real `<button>` reachable by Tab and activated with Enter/Space. Focus is always visible
- **Screen readers** — section headers are `<h2>`-wrapped buttons carrying `aria-expanded`, so the page has a navigable heading outline and announces open/closed state. The game selector uses `aria-pressed` (selection isn't signalled by color alone), async status messages and the recalculated take-home are `role="status"` live regions, and decorative chevrons/spinners are hidden from assistive tech
- **Zoom** — neither page restricts pinch-zoom

---

## Security

- **Content Security Policy** — every page declares a CSP via `<meta>` (GitHub Pages can't set response headers), including `tests.html`, which Pages publishes beside the apps. `connect-src` pins network access to only the feeds each page uses, and `default-src 'none'` / `base-uri 'none'` / `form-action 'none'` close off the rest. `'unsafe-inline'` for script and style is unavoidable given the no-build-step single-file design, so the policy is defence in depth rather than full XSS protection. `frame-ancestors` can't be set from a meta tag and would need a real header
- **Untrusted feed data** — winning numbers from `data.ny.gov` are validated before rendering: ball numbers must match `\d{1,2}`, the multiplier is coerced with `parseInt`, and draw dates must match `YYYY-MM-DD`; anything else is dropped. The CI-scorecard line on `tests.html` (the one place the GitHub API is still read, since the Recent-changes boxes were removed) only renders a link when the API hands back a real `https://github.com/` address
- **Jackpot proxy** — the Worker restricts CORS to the GitHub Pages origin. Note this only stops other *websites* using it; `Origin` is set by the browser, so a scripted client can still call it directly

---

## Architecture

```
GitHub Pages (static hosting)
    ├── ny-lottery-calculator.html
    │       ├── jackpots ──────► Cloudflare Worker (CORS proxy)
    │       │                    lottery-proxy.charlie-adams-176.workers.dev
    │       │                        └── scrapes usamega.com
    │       │                            (mobile Safari user-agent spoof)
    │       │                            fallback: lotteryusa.com
    │       └── winning numbers ─► data.ny.gov open-data API (direct, CORS)
    └── lottery-portfolio.html
            └── 1-yr T-bill yield ─► home.treasury.gov daily par yield XML (direct, CORS)

All three feeds are cached in localStorage for 6 hours per device.
```

---

## Tax Math

All figures are for **New York State residents outside NYC and Yonkers** (no city surcharge).

### Lottery Winnings (Calculator)

| Tax | Rate |
|-----|------|
| Federal withholding (at payment) | 24% |
| Federal top marginal (owed at filing) | 37% |
| NY State withholding (at payment) | 10.9% |
| NY State top rate (owed at filing) | 10.9% |

The calculator shows both the net check you receive on day one and the estimated additional tax owed when you file. NY withholding equals the top rate on purpose: state law ([20 NYCRR 171.11](https://www.law.cornell.edu/regulations/new-york/20-NYCRR-171.11), and [Publication 140-W](https://www.tax.ny.gov/pdf/publications/income/pub140w.pdf)) requires lottery prizes over $5,000 to be withheld at the **highest effective rate of state tax** — currently 10.9% — so the only filing-time top-up in the model is the federal 37% − 24% gap.

### Investment Income (Portfolio)

| Holding | Tax treatment | Effective rate |
|---------|--------------|----------------|
| SPAXX (money market) | Federal + NY ordinary income | 47.9% |
| T-bills | Federal ordinary only (NY-exempt) | 37.0% |
| NY Munis | Fully exempt (federal + state) | 0% |
| VTI / VXUS dividends | LTCG (20%) + NIIT (3.8%) + NY (10.9%) | 34.7% |

---

## Tests

`tests.html` loads both real pages in hidden same-origin iframes and calls their functions directly — no build step, no copies of the code under test. It pins the calculator's manual-amount parser, the winning-numbers allowlist, the tax-rate constants, and the winner-count clamp, plus the portfolio's allocation model (`computeIncome`), the Treasury feed parser, and the shared formatters.

Run it locally from a server (`python3 -m http.server 8010`, then open `http://localhost:8010/tests.html` — `file://` iframes are blocked in some browsers) and check the summary reads "All N tests pass". CI runs the same page headless on every push (`.github/workflows/tests.yml`) and fails the build if the summary goes red.

---

## Deployment

- **Hosting:** GitHub Pages (this repo, `main` branch)
- **Proxy:** Cloudflare Workers (free tier) — handles CORS and server-side scraping
- **No build step** — plain HTML/CSS/JS, no dependencies or bundler required; both pages share a single `theme.css` (generated in the claude-theme-pack repo) for color tokens and the four theme palettes, and the portfolio's charts use a vendored `chart.min.js` (Chart.js 4.4.1) rather than a CDN
