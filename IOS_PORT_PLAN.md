# iOS Port Plan — Lottery Calculator & Portfolio

*Written 2026-07-19 by Claude (Fable 5) after a full review of both HTML apps. This is the
blueprint for building the native iPhone app. It's written to be executed by a future Claude
session with no memory of this one — everything needed is either in this file or in the two
HTML files it references.*

---

## 1. What we're building

**One iOS app, not two.** The two web pages already behave like one product — they share
`theme.css`, share the theme preference, and the calculator feeds its net take-home into the
portfolio. On iOS that becomes a single app with a **TabView**:

| Tab | Source page | Purpose |
|---|---|---|
| **Calculator** | `ny-lottery-calculator.html` | Live jackpots, winning numbers, after-tax take-home |
| **Portfolio** | `lottery-portfolio.html` | Invest-the-lump-sum model with charts |
| **Settings** | (new) | Theme picker (replaces the dropdown on each page) |

New Xcode project, SwiftUI, in a **new repo folder `~/claude-lottery-ios`** (per global
preference: one folder per GitHub repo, never in iCloud-synced paths). The web app stays
as-is; the iOS app is a sibling, not a replacement.

### Tech choices (deliberately boring)

- **SwiftUI** for all UI. No UIKit unless something truly requires it.
- **Swift Charts** (Apple's framework) replaces Chart.js. The 235KB portfolio file is ~90%
  inlined Chart.js — none of that ports. Only ~20 named functions per page are real app logic.
- **No third-party dependencies.** Foundation's `URLSession`, `UserDefaults`, `XMLParser`,
  and Swift Charts cover everything the web apps do.
- **Minimum iOS 17** — allows `@Observable` models and modern Swift Charts.

---

## 2. What maps to what

| Web concept | iOS replacement |
|---|---|
| `localStorage` | `UserDefaults` (via `@AppStorage` for simple values) |
| `fetch()` | `URLSession` with `async/await` |
| Chart.js bar/donut/line | Swift Charts `BarMark` / `SectorMark` / `LineMark` |
| CSS theme variables | A `Theme` struct with SwiftUI `Color` values; 7 instances |
| Collapsible `<section>` headers | `DisclosureGroup` (or custom header + conditional content) |
| Sliders with click-to-edit values | `Slider` + tappable value label opening a `TextField` alert |
| Cross-page nav buttons | Tab switching (free) |
| "Recent changes" (GitHub commits) | **Drop it.** It's a web-page feature; App Store apps ship release notes instead |
| Colored number balls (CSS circles) | Small SwiftUI `Circle()` views with theme colors |
| Shorthand input (`325M`, `1.2B`) | Port `parseField` logic to a Swift string parser |

### localStorage keys → UserDefaults keys

Keep the same key names — costs nothing and keeps the two codebases mentally aligned:

`lottery-theme`, `lottery-game`, `lottery-npeople`, `lottery-details`, `lottery-winning`,
`lottery-net-takehome`, `lottery-jackpot-cache`, `lottery-winning-cache`,
`lottery-tbill-cache`, `lottery-portfolio-sliders`, `lottery-portfolio-sections`.

The three `*-cache` entries store `{data, timestamp}` with a 6-hour TTL — replicate exactly
that pattern with `Codable` structs. No migration concerns: the app starts fresh.

---

## 3. Architecture

```
LotteryApp/
├── App/
│   ├── LotteryApp.swift          @main, TabView, theme injection
│   └── Theme.swift               Theme struct + 7 palettes + ThemeStore
├── Engine/                       ← pure logic, no UI, fully unit-tested
│   ├── TaxMath.swift             all tax constants & take-home computation
│   ├── PortfolioModel.swift      allocation buckets, income, surplus iteration
│   └── DrawSchedule.swift        next-draw dates (Powerball Mon/Wed/Sat, MM Tue/Fri, in ET)
├── Networking/
│   ├── JackpotService.swift      Cloudflare Worker proxy
│   ├── WinningNumbersService.swift   data.ny.gov
│   ├── TreasuryService.swift     1-yr T-bill yield from treasury.gov XML
│   └── CachedFetch.swift         generic 6-hour UserDefaults cache wrapper
├── Calculator/
│   ├── CalculatorView.swift
│   ├── JackpotCardView.swift
│   ├── WinningNumbersView.swift  (balls, Power Play, collapsible)
│   └── TaxBreakdownView.swift    (collapsible tables)
├── Portfolio/
│   ├── PortfolioView.swift
│   ├── AssumptionsView.swift     (sliders with tap-to-edit)
│   ├── HoldingsTableView.swift   (card layout — the mobile reflow is the only layout needed)
│   ├── WaterfallView.swift
│   └── ChartsView.swift          (stacked bar, donut, 10-yr projection line)
└── Tests/
    ├── TaxMathTests.swift
    ├── PortfolioModelTests.swift
    └── DrawScheduleTests.swift
```

The **Engine layer is the heart of the port** — it's where correctness matters and where the
web apps' logic must be transcribed faithfully. Port it first, test it against known outputs
from the web app (enter the same inputs in both, compare every displayed number).

---

## 4. The tax engine (port faithfully, test hardest)

From the calculator (`function calc`):

- Federal withholding **24%**, federal top marginal **37%** (delta owed at filing)
- NY State withholding **10.5%**, NY top rate **10.9%** (delta owed at filing)
- Cash option estimated at **60%** of advertised jackpot when only annuity is entered
- Split among N winners *before* tax
- Output: net check on day one + additional owed at filing = net take-home

From the portfolio (`computeIncome`, `readAssumptions`, `zeroSurplus`):

- **Allocation model** (spending-driven): SPAXX = 1 year of annual spending, T-bills = 3
  years, NY Munis = 4 years, remainder → equities split VTI/VXUS by slider
- **Tax treatment per holding**: SPAXX 47.9% (fed+NY ordinary), T-bills 37% (NY-exempt),
  Munis 0%, VTI/VXUS dividends 34.7% (20% LTCG + 3.8% NIIT + 10.9% NY)
- **`zeroSurplus`**: fixed-point iteration that raises annual spending until surplus = 0
  (buckets rescale with spending each pass — port the iteration, don't try to solve in
  closed form)
- **10-year projection**: compound equity growth at the slider rate for VTI+VXUS and total

Unit tests should pin exact expected values computed by hand (or read off the live web page)
— e.g. "a $500M advertised jackpot, 1 winner → net take-home $X".

---

## 5. Networking (three feeds + one gotcha)

| Feed | URL | Notes |
|---|---|---|
| Jackpots | `https://lottery-proxy.charlie-adams-176.workers.dev` | **Gotcha — see below** |
| Winning numbers | `https://data.ny.gov/resource/d6yy-54nr.json` (Powerball), `5xaw-6ayf.json` (Mega Millions) | Plain JSON, direct, no auth. Same parsing as web `renderWinning` |
| T-bill yield | treasury.gov daily par yield curve XML (see `tbXmlUrl` in portfolio for URL construction — month-keyed) | Parse the latest 1-yr (`parseLatest1yr` logic). Regex over the XML text is acceptable; full `XMLParser` not required |

**The Worker gotcha:** `worker.js` line 7 returns **403 Forbidden** to any request whose
`Origin` header isn't exactly `https://eagleadams86.github.io`. Native apps send no Origin
header by default. **Fix: the iOS app sets the header manually** —

```swift
var req = URLRequest(url: proxyURL)
req.setValue("https://eagleadams86.github.io", forHTTPHeaderField: "Origin")
```

This works with **zero Worker changes** (important: Worker redeploys are manual, user-run).
CORS is a browser-enforcement mechanism; URLSession ignores the response headers entirely.

**Caching:** replicate the web behavior — every feed cached 6 hours in UserDefaults, served
instantly from cache, Refresh button forces a live fetch. Build one generic `CachedFetch`
helper rather than three copies. All fetches fail soft: on error show the cached/manual/
default value, never block the UI (the web apps already behave this way — keep it).

---

## 6. Themes

`theme.css` defines 7 palettes (Light `:root`, Dark, Midnight, Forest, Synthwave, Solarized,
Sepia) over ~25 canonical tokens. Port as:

```swift
struct Theme {
    let bg, bgCard, bgCardAlt, border, borderStrong: Color
    let textPrimary, textSecondary, textMuted, textHint: Color
    let green, red, amber: Color
    let greenBg, redBg, amberBg: Color
    let btnBg, btnText: Color
    let chartTick, chartGrid: Color
    // (spinner/input/focus tokens fold into the above on iOS)
}
```

Transcribe the hex values **directly from `theme.css`** — it is the single source of truth;
don't invent adjusted colors. Default theme: **Midnight** (matches web + global preference).
Store selection under `lottery-theme`, expose via `.environment`. Charts read `chartTick`/
`chartGrid` per theme exactly as the web charts do.

Note: the iOS app intentionally does **not** follow the system light/dark setting — themes
are an explicit user choice, same as the web.

---

## 7. Build order (each phase ends runnable)

1. **Scaffold** — Xcode project, TabView shell, Theme system with all 7 palettes, Settings
   tab with working theme picker. *Proves: project builds, themes work.*
2. **Tax engine + tests** — `TaxMath`, `PortfolioModel`, `DrawSchedule` with unit tests
   pinned to web-app outputs. No UI. *Proves: the math matches the web.*
3. **Calculator UI** — manual jackpot entry → full tax breakdown, shorthand parsing,
   winner split, collapsible tables. Still no networking. *Proves: core screen works offline.*
4. **Networking** — the three services + 6-hour cache + Refresh. Jackpots and winning
   numbers go live; T-bill auto-fill lands in the (not-yet-built) portfolio's data model.
   *Proves: all feeds work from a real device.*
5. **Portfolio UI** — sliders with tap-to-edit, summary tiles (incl. tap-to-zero surplus),
   holdings cards, waterfall. *Proves: the big screen works.*
6. **Charts** — stacked income bar, allocation donut, 10-yr projection lines in Swift Charts,
   theme-aware. *Proves: feature parity.*
7. **Polish** — persistence of all sliders/sections/game selection, calculator→portfolio
   take-home handoff, app icon (Midnight-palette ball motif), launch screen.

Phases 1–3 need no network and no Apple developer account decisions — they run in the
simulator. That's the natural first session.

### Stretch goals (post-parity, in rough order of payoff)

- **Home-screen widget**: current jackpots + next draw date (WidgetKit; reuses JackpotService)
- **Draw-night notification**: local notification on draw days ("Powerball tonight — $XXX M")
- **Live Activity** on draw nights showing numbers once posted

---

## 8. Distribution decision (user call, not model call)

| Route | Cost | Reality |
|---|---|---|
| Free Apple ID sideload | $0 | App expires every **7 days**, must re-install from Xcode. Fine for trying it out, annoying long-term |
| Apple Developer Program | $99/yr | TestFlight (90-day builds, easy reinstall) or real App Store release |

Recommendation: start free for phases 1–4; decide on the $99 once the app is something you
open daily. App Store note if it comes to that: this is an informational tax calculator —
it doesn't sell tickets or facilitate gambling — so it doesn't hit the gambling-app
restrictions (App Review guideline 5.3), but expect Review to look twice at anything with
"lottery" in the name; the metadata should lead with "tax calculator".

Prerequisites for phase 1: a Mac with **Xcode 16+** installed (free, ~10 GB, App Store),
signed into an Apple ID (Xcode → Settings → Accounts).

---

## 9. Fidelity notes for the implementing model

- **The web app is the spec.** When this plan and the HTML disagree, the HTML wins — read
  the actual `calc()` / `computeIncome()` implementations before writing Swift.
- Number formatting: replicate `fm` / `fm1` / `fmShort` behavior ($1.23M-style short forms)
  with Swift `FormatStyle`; check edge cases around billions.
- Draw-date logic runs in **America/New_York** regardless of device timezone (`nextDraw`
  in the calculator) — port with an explicit `TimeZone(identifier: "America/New_York")`.
- The portfolio's holdings table only needs the **card layout** (the web's narrow-screen
  reflow) — the wide table variant is desktop-only.
- Keep engine types `Codable` + value-semantic (structs) so widget/notification stretch
  goals can reuse them without refactoring.
- Commit style in the new repo: plain-English subjects, same convention as this repo.
