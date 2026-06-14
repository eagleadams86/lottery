# 🎰 NY Lottery Take-Home Calculator

A pair of lightweight single-page web tools for calculating **real after-tax lottery winnings** for New York State residents, with live jackpot data pulled automatically.

Live at: **[eagleadams86.github.io/lottery/ny-lottery-calculator.html](https://eagleadams86.github.io/lottery/ny-lottery-calculator.html)**

---

## Files

| File | Description |
|------|-------------|
| `ny-lottery-calculator.html` | Main lottery take-home calculator |
| `lottery-portfolio.html` | Portfolio / holdings tracker |

---

## Features

### NY Lottery Calculator
- **Live jackpot data** — auto-fetches current Powerball and Mega Millions jackpots from `usamega.com` (with `lotteryusa.com` as fallback), via a Cloudflare Worker proxy
- **Lump sum vs. annuity** — calculates take-home for both payout options
- **Full NY tax breakdown** — federal withholding (24%), federal top marginal (37%), NY State withholding (10.5%), and NY State top rate (10.9%); shows both withheld at payment and additional owed at filing
- **Split among winners** — supports dividing the jackpot among multiple people
- **Shorthand input** — accepts `325M`, `1.2B`, etc.
- **Dark/light mode** — toggleable, preference saved in `localStorage`
- **Collapsible tax tables** — detailed breakdown hidden by default, expandable on demand
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

| Tax | Rate |
|-----|------|
| Federal withholding (at payment) | 24% |
| Federal top marginal (owed at filing) | 37% |
| NY State withholding (at payment) | 10.5% |
| NY State top rate (owed at filing) | 10.9% |

The calculator shows both the net check you receive on day one and the estimated additional tax owed when you file.

---

## Deployment

- **Hosting:** GitHub Pages (this repo, `main` branch)
- **Proxy:** Cloudflare Workers (free tier) — handles CORS and server-side scraping
- **No build step** — plain HTML/CSS/JS, no dependencies or bundler required
