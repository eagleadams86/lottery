# NY Lottery Take-Home Calculator & Portfolio

A pair of lightweight single-page web tools for calculating **real after-tax lottery winnings** for New York State residents, with live jackpot data and recent winning numbers pulled automatically.

- **Calculator:** [eagleadams86.github.io/lottery/ny-lottery-calculator.html](https://eagleadams86.github.io/lottery/ny-lottery-calculator.html)
- **Portfolio:** [eagleadams86.github.io/lottery/lottery-portfolio.html](https://eagleadams86.github.io/lottery/lottery-portfolio.html)

---

## Files

| File | Description |
|------|-------------|
| `ny-lottery-calculator.html` | After-tax lottery take-home calculator with live jackpots and winning numbers |
| `lottery-portfolio.html` | What-if model of investing the lump sum as a tax-aware portfolio |
| `theme.css` | Shared color tokens + 4 theme palettes, linked by both pages. Generated in the claude-theme-pack repo (the source of truth for all apps); every color pair is script-verified to meet WCAG AA contrast |
| `favicon.ico` | The icon both pages share — the fallback a browser fetches from the site root on its own |
| `make_favicon.py` | Draws `favicon.ico` to match the inline SVG icon in both pages |
| `worker.js` | Cloudflare Worker source for the jackpot CORS proxy (deployed separately at `lottery-proxy.charlie-adams-176.workers.dev`) |
| `tests.html` | Dev-only test page pinning both pages' pure functions (input parsing, feed validation, tax/allocation math, formatters); run by CI on every push |

The icon is three drawn balls, on the midnight tile the whole app family wears; both pages
show the same mark beside their title. `make_favicon.py` (Pillow) keeps `favicon.ico` and the
pages' inline SVG the same picture, rather than leaving a binary nobody can review in a diff.
Re-run it with `python3 make_favicon.py`, then bump the `?v=` on every `favicon.ico`
reference — browsers hold on to an icon for a long time.

Native mobile ports have shipped and their build plans now live in their own (private) repos:

- **iOS:** [lottery-ios](https://github.com/eagleadams86/lottery-ios) (calculator only)
- **Android:** [lottery-android](https://github.com/eagleadams86/lottery-android) (calculator only)

---

## Features

### Lottery Portfolio

Targeted at **Niagara County, NY residents** (outside NYC/Yonkers) who want to model what a lottery lump-sum would actually look like as a managed investment portfolio.

- **Interactive sliders with editable values** — adjust take-home amount, annual spending, T-bill yield, muni yield, VTI/VXUS dividend yields, equity growth rate, and VTI/VXUS split; click any displayed value to type a number directly. The money boxes understand unit suffixes (`5M`, `1.5B`, `125K`) as well as bare numbers, and anything unreadable snaps back to the current value rather than being silently misread
- **Spending-driven allocation model** — the cash/bond buckets scale with annual spending (SPAXX = 1 year of spending, T-bills = 3 years, NY Munis = 4 years) and everything left over goes into equities at the chosen VTI/VXUS split. When spending is high relative to the portfolio (above 1/8 of it) the full 8-year ladder no longer fits, so all three buckets are scaled down proportionally and a note explains why — allocations always add up to exactly the portfolio total, never more
- **Live T-bill yield** — the T-bill yield slider auto-fills from the US Treasury's daily par yield curve (1-year maturity), fetched on page load with an "as of" date shown next to the label; cached in `localStorage` for 6 hours so repeat visits don't re-query the Treasury feed; falls back to the default if the feed is unreachable, and can still be dragged to override
- **Holdings breakdown table** — shows each holding (SPAXX, T-bills, Munis, VTI, VXUS), its allocation, percentage of portfolio, gross income, tax treatment, and after-tax income
- **Summary metrics** — key portfolio-level numbers computed live from slider inputs; click the **Surplus vs spending** tile to raise annual spending to your after-tax income, zeroing the surplus (iterates to a fixed point since the cash/bond buckets scale with spending)
- **Income waterfall** — visual breakdown of gross income to after-tax income across all holdings
- **Charts** — stacked bar (income by holding with tax drag overlay), donut (portfolio allocation), and line chart (10-year equity growth projection for VTI + VXUS vs. total portfolio)
- **Tax-aware math** — applies 37% federal, 10.9% NY State, 20% LTCG, and 3.8% NIIT rates depending on holding type
- **Themes** — dropdown in the upper right with 4 themes, listed alphabetically (Dark, Light, Midnight, Sepia); defaults to Midnight, preference saved in `localStorage`. Charts adapt their axis/grid colors per theme, and the bars adapt their fills: a bar's area is a tint of its series colour mixed toward the card behind it, with the full-strength colour on the outline. That's the shared convention across these apps (it lives in the theme pack's rules) — a solid fill has to be dark to clear the contrast rules on the Light and Sepia cards, and five dark bars side by side read as slabs of near-black on a pale page. The donut and the small legend swatches deliberately stay solid: their job is telling several colours apart from each other, which a tint compresses
- **Collapsible sections** — every section (Assumptions, Summary, Portfolio breakdown, Income waterfall, Charts, 10-year growth projection) can be collapsed from its header, by mouse or keyboard; open/closed state is remembered across visits via `localStorage`
- **Remembers your settings** — slider values restored on revisit via `localStorage`. The take-home slider is seeded from the calculator's net take-home, but only when the calculator has produced a *new* figure; if you move that slider yourself it stays where you put it
- **Mobile-friendly** — portfolio breakdown table reflows to a card layout on narrow screens
- **Cross-page navigation** — button to jump directly to the calculator
- **No build step** — plain HTML/CSS/JS, no dependencies beyond Chart.js (bundled inline); shares `theme.css` with the calculator for a unified palette

---

### NY Lottery Calculator
- **Live jackpot data** — auto-fetches current Powerball and Mega Millions jackpots from `usamega.com` (with `lotteryusa.com` as fallback), via a Cloudflare Worker proxy
- **Cached for 6 hours** — fetched jackpots are stored in `localStorage`; page loads/refreshes within 6 hours render instantly from the cache without re-scraping. The **Refresh** button always forces a live fetch (e.g. right after a draw) — and also force-refreshes the winning numbers when that section is open. Caps redundant scraping from repeated visits on a device
- **Next draw dates** — shows upcoming draw date for each game (Powerball: Mon/Wed/Sat, Mega Millions: Tue/Fri), computed client-side in ET
- **Latest winning numbers** — collapsible section showing the most recent draw results, fetched live from NY's open data portal (`data.ny.gov`); displays color-coded balls (red Powerball, gold Mega Ball) and the Power Play multiplier, and tracks the game selected at the top. Expanded by default; open/closed state remembered via `localStorage`, so collapsing it sticks across visits. Results are cached in `localStorage` for 6 hours, so reopening the section within that window renders instantly without re-querying the API; the top **Refresh** button force-pulls fresh results when the section is open
- **Lump-sum take-home** — computes the after-tax value of the cash option; if only the advertised (annuity) jackpot is entered, the cash value is estimated at 60%
- **Full NY tax breakdown** — federal withholding (24%), federal top marginal (37%), NY State withholding (10.5%), and NY State top rate (10.9%); shows both withheld at payment and additional owed at filing
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

- **Content Security Policy** — both pages declare a CSP via `<meta>` (GitHub Pages can't set response headers). `connect-src` pins network access to only the feeds each page uses, and `default-src 'none'` / `base-uri 'none'` / `form-action 'none'` close off the rest. `'unsafe-inline'` for script and style is unavoidable given the no-build-step single-file design, so the policy is defence in depth rather than full XSS protection. `frame-ancestors` can't be set from a meta tag and would need a real header
- **Untrusted feed data** — winning numbers from `data.ny.gov` are validated before rendering: ball numbers must match `\d{1,2}`, the multiplier is coerced with `parseInt`, and draw dates must match `YYYY-MM-DD`; anything else is dropped. Commit links from the GitHub API are only rendered as links when the URL is a real `https://github.com/` address
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

### Lottery winnings (Calculator)

| Tax | Rate |
|-----|------|
| Federal withholding (at payment) | 24% |
| Federal top marginal (owed at filing) | 37% |
| NY State withholding (at payment) | 10.5% |
| NY State top rate (owed at filing) | 10.9% |

The calculator shows both the net check you receive on day one and the estimated additional tax owed when you file.

### Investment income (Portfolio)

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
- **No build step** — plain HTML/CSS/JS, no dependencies or bundler required; both pages share a single `theme.css` (generated in the claude-theme-pack repo) for color tokens and the four theme palettes
