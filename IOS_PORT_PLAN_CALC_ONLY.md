# iOS Port Plan — Calculator Only (no Portfolio)

*Written 2026-07-19 by Claude (Fable 5). This is the **smaller alternative** to
`IOS_PORT_PLAN.md`: just the after-tax take-home calculator from
`ny-lottery-calculator.html`, leaving the portfolio out. Execute **one** of the two plans,
not both — this one is designed so the portfolio can be added later as a new tab by
following the full plan's §4–§6, without reworking anything built here. Where this plan is
silent, the full plan applies (themes, distribution, fidelity rules); where they conflict,
this one wins for the calculator-only build.*

---

## 1. Shape of the app

One screen. A `NavigationStack` whose single view is the calculator — jackpot cards at the
top, take-home results below, collapsible sections for winning numbers and the tax tables.
Theme picker lives in a toolbar menu (no Settings tab needed at this size).

Same repo folder as the full plan would use: **`~/claude-lottery-ios`** — because this app
*is* the full app's Calculator tab, just without the TabView shell yet. If the portfolio is
added later, the shell grows a TabView and this screen moves into it unchanged.

Everything in the full plan's §1 tech choices holds (SwiftUI, iOS 17, no dependencies) with
one deletion: **no Swift Charts** — the calculator has no charts. That removes the largest
unfamiliar-framework risk from the project.

## 2. What ports (and what doesn't)

**In:**
- Tax engine (`calc`): 24% federal withholding / 37% top marginal, 10.5% NY withholding /
  10.9% NY top rate, cash option estimated at 60% of advertised jackpot, split among N
  winners before tax, net-check-day-one + owed-at-filing breakdown
- Shorthand input parsing (`parseField`): `325M`, `1.2B`, plain numbers
- Live jackpots via the Cloudflare Worker — **including the Origin-header fix** (full plan
  §5): the Worker 403s requests without `Origin: https://eagleadams86.github.io`; the app
  sets that header manually on its `URLRequest`. Zero Worker changes.
- Winning numbers from data.ny.gov (`d6yy-54nr.json` Powerball, `5xaw-6ayf.json` Mega
  Millions), colored ball display (red Powerball, gold Mega Ball), Power Play multiplier
- Next-draw dates computed in **America/New_York** (Powerball Mon/Wed/Sat, MM Tue/Fri)
- 6-hour cache + Refresh-forces-live for both feeds (generic `CachedFetch` per full plan §5)
- Game selection, winner count, collapsed/expanded states, theme — persisted in
  UserDefaults under the same key names the web app uses (`lottery-game`,
  `lottery-npeople`, `lottery-details`, `lottery-winning`, `lottery-theme`,
  `lottery-jackpot-cache`, `lottery-winning-cache`)
- All 7 themes, Midnight default (hex values from `theme.css`; full plan §6 struct)

**Out (with the portfolio):**
- The entire portfolio engine, its sliders, charts, and the Treasury T-bill feed
- The cross-page handoff — **but still write `lottery-net-takehome` to UserDefaults after
  each calculation.** It costs one line and means a future portfolio tab picks up the
  handoff exactly like the web version does.
- The "Recent changes" section (dropped in the full plan too)

## 3. Architecture (subset of the full plan §3)

```
LotteryCalc/
├── App/            LotteryApp.swift, Theme.swift        (identical to full plan)
├── Engine/         TaxMath.swift, DrawSchedule.swift    (PortfolioModel omitted)
├── Networking/     JackpotService, WinningNumbersService, CachedFetch
│                   (TreasuryService omitted)
├── Calculator/     CalculatorView, JackpotCardView, WinningNumbersView, TaxBreakdownView
└── Tests/          TaxMathTests, DrawScheduleTests
```

Folder names deliberately match the full plan so a later portfolio addition is additive:
new `Portfolio/` + `PortfolioModel.swift` + `TreasuryService.swift` + a TabView — nothing
here moves or renames.

## 4. Build order

1. **Scaffold + themes** — project, 7 palettes, toolbar theme menu. *Runs in simulator.*
2. **Tax engine + tests** — `TaxMath` and `DrawSchedule` with tests pinned to web-app
   outputs (same jackpot in, same numbers out, to the dollar).
3. **Calculator UI, offline** — manual jackpot entry, shorthand parsing, winner stepper,
   full collapsible tax breakdown. Feature-complete without a network.
4. **Live data** — jackpot proxy (with Origin header), winning numbers, next-draw dates,
   6-hour cache, Refresh. First phase worth running on the real phone.
5. **Polish** — persistence wiring, app icon (Midnight ball motif), launch screen, the
   `lottery-net-takehome` write.

That's the whole app — roughly half the phases of the full plan, and phases 1–3 need
nothing but Xcode.

**Stretch goals** (these fit the calculator even better than the full app):
- **Home-screen widget**: current jackpots + next draw date — arguably the best form of
  this entire product; the engine and `JackpotService` are widget-ready as built
- **Draw-night notification**: "Powerball tonight — $XXX M"

## 5. Everything else

Distribution, App Review framing ("tax calculator", not gambling — full plan §8),
prerequisites (Xcode 16+, Apple ID), fidelity rules (the HTML is the spec; number
formatting via `fmt`/`fmtM`; ball styling from the page CSS), and repo/commit conventions:
all identical to `IOS_PORT_PLAN.md` §8–§9. Read that plan's §5 Worker gotcha in full
before writing `JackpotService`.

---

## 6. Addendum (2026-07-20): carry over the shipped Android app's changes

The Android port (`~/claude-lottery-android`, github.com/eagleadams86/lottery-android) is
complete — all five phases plus the widget stretch goal — and its post-plan commits made
layout decisions the user is happy with. **For everything below, the Android app is the
spec and supersedes the web HTML where they differ.** The HTML remains the spec for
behavior and math (tax engine, parsing, caching, persistence keys — nothing there changed).

### 6a. Calculator layout (differs from the web page)

- **Game cards side by side**, one per game, each card's info stacked vertically inside,
  content centered — both cards fit on any phone width instead of the web page's wider
  layout.
- **Take-home card**: net amount and effective tax rate side by side; the tax-rate column
  vertically centered against the taller net-amount column; the bold dollar values shrink
  on narrow screens rather than wrap (SwiftUI: `.minimumScaleFactor` + `.lineLimit(1)`).
- **Metric cards**: content centered.
- **Winning numbers card**: content centered; the draw date sits *below* the row of balls,
  not beside it; the Power Play badge wraps as one unit, never mid-badge (keep badge text
  on one line inside a fixed group).

### 6b. Keyboard dismissal

The manual-entry number fields trap focus without help. Match the Android fix: a Done
button on the keyboard (toolbar `ToolbarItemGroup(placement: .keyboard)`) and tap-outside
clears focus (`@FocusState` + a background tap gesture or
`.scrollDismissesKeyboard(.interactively)`).

### 6c. Widget — promoted from stretch goal to Phase 6

The widget turned out to be arguably the best part of the product; build it, not as a
maybe. WidgetKit **medium (4×2-equivalent)** widget named "Jackpots":

- Two columns, **Powerball left, Mega Millions right**, columns pinned to fill the
  widget's height. Per column, text centered: game name, jackpot (largest type), cash
  value stacked under it (not beside — beside didn't fit), next draw date (muted, smallest).
- Reads the same 6-hour jackpot cache as the app; if the network is down, stale cache at
  any age still displays (next-draw dates are computed locally, so they're always right).
- Tapping anywhere opens the app.
- Colors follow the app's selected theme, and the app pushes a widget refresh after every
  successful fetch **and every theme change** — on iOS that's
  `WidgetCenter.shared.reloadAllTimelines()`, cheap and synchronous to call. Android
  needed a battery-optimization exemption to make this prompt; iOS needs no equivalent.

**Plan-level consequence — do this in Phase 1, not Phase 6:** the widget extension can't
read the app's standard `UserDefaults`. Create an **App Group** (e.g.
`group.com.eagleadams86.lotterycalc`) at project setup and put *all* the §2 persistence
keys in `UserDefaults(suiteName:)` from the start, so the widget sees the theme and
jackpot cache for free and no key migration is ever needed. This amends §2's UserDefaults
bullet; the key names themselves are unchanged.

### 6d. Remaining stretch goal

Only the draw-night notification ("Powerball tonight — $XXX M") is still a stretch goal.
