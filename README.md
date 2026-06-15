# 🎰 NY Lottery Take-Home Calculator

A pair of lightweight single-page web tools for calculating **real after-tax lottery winnings** for New York State residents, with live jackpot data pulled automatically.

- **Calculator:** [eagleadams86.github.io/lottery/ny-lottery-calculator.html](https://eagleadams86.github.io/lottery/ny-lottery-calculator.html)
- **Portfolio:** [eagleadams86.github.io/lottery/lottery-portfolio.html](https://eagleadams86.github.io/lottery/lottery-portfolio.html)

---

## Files

| File | Description |
|------|-------------|
| `ny-lottery-calculator.html` | Main lottery take-home calculator |
| `lottery-portfolio.html` | Portfolio / holdings tracker |

---

## Features

### Lottery Portfolio

Targeted at **Niagara County, NY residents** (outside NYC/Yonkers) who want to model what a lottery lump-sum would actually look like as a managed investment portfolio.

- **Interactive sliders with editable values** — adjust take-home amount, annual spending, T-bill yield, muni yield, VTI/VXUS dividend yields, equity growth rate, and VTI/VXUS split; click any displayed value to type a number directly
- **Holdings breakdown table** — shows each holding (SPAXX, T-bills, Munis, VTI, VXUS), its allocation, percentage of portfolio, gross income, tax treatment, and after-tax income
- **Summary metrics** — key portfolio-level numbers computed live from slider inputs
- **Income waterfall** — visual breakdown of gross income to after-tax income across all holdings
- **Charts** — stacked bar (income by holding with tax drag overlay), donut (portfolio allocation), and line chart (10-year equity growth projection for VTI + VXUS vs. total portfolio)
- **Tax-aware math** — applies 37% federal, 10.9% NY State, 20% LTCG, and 3.8% NIIT rates depending on holding type
- **Dark/light mode** — toggleable button in the upper right, defaults to light, preference saved in `localStorage`
- **Remembers your settings** — slider values restored on revisit via `localStorage`; take-home slider auto-populated from the calculator's last net take-home
- **Mobile-friendly** — portfolio breakdown table reflows to a card layout on narrow screens
- **Cross-page navigation** — button to jump directly to the calculator
- **No build step** — plain HTML/CSS/JS, no dependencies beyond Chart.js (bundled inline)

---

### NY Lottery Calculator
- **Live jackpot data** — auto-fetches current Powerball and Mega Millions jackpots from `usamega.com` (with `lotteryusa.com` as fallback), via a Cloudflare Worker proxy
- **Next draw dates** — shows upcoming draw date for each game (Powerball: Mon/Wed/Sat, Mega Millions: Tue/Fri), computed client-side in ET
- **Lump sum vs. annuity** — calculates take-home for both payout options
- **Full NY tax breakdown** — federal withholding (24%), federal top marginal (37%), NY State withholding (10.5%), and NY State top rate (10.9%); shows both withheld at payment and additional owed at filing
- **Split among winners** — supports dividing the jackpot among multiple people
- **Shorthand input** — accepts `325M`, `1.2B`, etc.
- **Dark/light mode** — toggleable, defaults to light, preference saved in `localStorage`
- **Collapsible tax tables** — detailed breakdown hidden by default, expandable on demand
- **Remembers your settings** — game selection, winner count, and tax breakdown state all restored on revisit
- **Feeds the portfolio** — net take-home is saved to `localStorage` and used to pre-fill the portfolio's take-home slider
- **Cross-page navigation** — button to jump directly to the portfolio
- **iOS compatible** — tested for mobile Safari quirks

---

## Architecture

```
GitHub Pages (static hosting)
    └── ny-lottery-calculator.html
            │
            └── fetches jackpot data via
                    │
                    ▼
        Cloudflare Worker (CORS proxy)
        lottery-proxy.charlie-adams-176.workers.dev
                    │
                    └── scrapes usamega.com
                        (mobile Safari user-agent spoof)
                        fallback: lotteryusa.com
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
- **No build step** — plain HTML/CSS/JS, no dependencies or bundler required
