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
| `theme.css` | Shared color tokens + 7 theme palettes, linked by both pages (single source of truth for the theme) |
| `favicon.ico` | Shared favicon |

---

## Features

### Lottery Portfolio

Targeted at **Niagara County, NY residents** (outside NYC/Yonkers) who want to model what a lottery lump-sum would actually look like as a managed investment portfolio.

- **Interactive sliders with editable values** — adjust take-home amount, annual spending, T-bill yield, muni yield, VTI/VXUS dividend yields, equity growth rate, and VTI/VXUS split; click any displayed value to type a number directly
- **Spending-driven allocation model** — the cash/bond buckets scale with annual spending (SPAXX = 1 year of spending, T-bills = 3 years, NY Munis = 4 years) and everything left over goes into equities at the chosen VTI/VXUS split
- **Live T-bill yield** — the T-bill yield slider auto-fills from the US Treasury's daily par yield curve (1-year maturity), fetched on page load with an "as of" date shown next to the label; cached in `localStorage` for 6 hours so repeat visits don't re-query the Treasury feed; falls back to the default if the feed is unreachable, and can still be dragged to override
- **Holdings breakdown table** — shows each holding (SPAXX, T-bills, Munis, VTI, VXUS), its allocation, percentage of portfolio, gross income, tax treatment, and after-tax income
- **Summary metrics** — key portfolio-level numbers computed live from slider inputs; click the **Surplus vs spending** tile to raise annual spending to your after-tax income, zeroing the surplus (iterates to a fixed point since the cash/bond buckets scale with spending)
- **Income waterfall** — visual breakdown of gross income to after-tax income across all holdings
- **Charts** — stacked bar (income by holding with tax drag overlay), donut (portfolio allocation), and line chart (10-year equity growth projection for VTI + VXUS vs. total portfolio)
- **Tax-aware math** — applies 37% federal, 10.9% NY State, 20% LTCG, and 3.8% NIIT rates depending on holding type
- **Themes** — dropdown in the upper right with 7 themes, listed alphabetically (Dark, Forest, Light, Midnight, Sepia, Solarized, Synthwave); defaults to Midnight, preference saved in `localStorage`. Charts adapt their axis/grid colors per theme
- **Collapsible sections** — every section (Assumptions, Summary, Portfolio breakdown, Income waterfall, Charts, 10-year growth projection) can be collapsed by clicking its header; open/closed state is remembered across visits via `localStorage`
- **Remembers your settings** — slider values restored on revisit via `localStorage`; take-home slider auto-populated from the calculator's last net take-home
- **Mobile-friendly** — portfolio breakdown table reflows to a card layout on narrow screens
- **Cross-page navigation** — button to jump directly to the calculator
- **No build step** — plain HTML/CSS/JS, no dependencies beyond Chart.js (bundled inline); shares `theme.css` with the calculator for a unified palette

---

### NY Lottery Calculator
- **Live jackpot data** — auto-fetches current Powerball and Mega Millions jackpots from `usamega.com` (with `lotteryusa.com` as fallback), via a Cloudflare Worker proxy
- **Cached for 6 hours** — fetched jackpots are stored in `localStorage`; page loads/refreshes within 6 hours render instantly from the cache without re-scraping. The **Refresh** button always forces a live fetch (e.g. right after a draw) — and also force-refreshes the winning numbers when that section is open. Caps redundant scraping from repeated visits on a device
- **Next draw dates** — shows upcoming draw date for each game (Powerball: Mon/Wed/Sat, Mega Millions: Tue/Fri), computed client-side in ET
- **Latest winning numbers** — collapsible section showing the most recent draw results, fetched live from NY's open data portal (`data.ny.gov`); displays color-coded balls (red Powerball, gold Mega Ball) and the Power Play multiplier, and tracks the game selected at the top. Collapsed by default; open/closed state remembered via `localStorage`. Results are cached in `localStorage` for 6 hours, so reopening the section within that window renders instantly without re-querying the API; the top **Refresh** button force-pulls fresh results when the section is open
- **Lump-sum take-home** — computes the after-tax value of the cash option; if only the advertised (annuity) jackpot is entered, the cash value is estimated at 60%
- **Full NY tax breakdown** — federal withholding (24%), federal top marginal (37%), NY State withholding (10.5%), and NY State top rate (10.9%); shows both withheld at payment and additional owed at filing
- **Split among winners** — supports dividing the jackpot among multiple people
- **Shorthand input** — accepts `325M`, `1.2B`, etc.
- **Themes** — dropdown in the upper right with 7 themes, listed alphabetically (Dark, Forest, Light, Midnight, Sepia, Solarized, Synthwave); defaults to Midnight, preference saved in `localStorage` and shared with the portfolio page
- **Collapsible tax tables** — detailed breakdown hidden by default, expandable on demand
- **Remembers your settings** — game selection, winner count, and tax breakdown state all restored on revisit
- **Feeds the portfolio** — net take-home is saved to `localStorage` and used to pre-fill the portfolio's take-home slider
- **Cross-page navigation** — button to jump directly to the portfolio
- **iOS compatible** — tested for mobile Safari quirks

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

## Deployment

- **Hosting:** GitHub Pages (this repo, `main` branch)
- **Proxy:** Cloudflare Workers (free tier) — handles CORS and server-side scraping
- **No build step** — plain HTML/CSS/JS, no dependencies or bundler required; both pages share a single `theme.css` for color tokens and the light/dark palette
