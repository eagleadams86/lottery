# Android Port Plan — Calculator Only (no Portfolio)

*Written 2026-07-19 by Claude (Fable 5). Android counterpart to
`IOS_PORT_PLAN_CALC_ONLY.md`. **The behavior spec lives there and in
`ny-lottery-calculator.html`** — what ports and what doesn't (its §2), the tax rates, the
shorthand parsing, the Cloudflare Worker Origin-header gotcha (full iOS plan §5), the
feeds, the cache rules, and the persistence key names are all identical and are not
repeated here. This file covers only what's different on Android. Where the two platforms'
plans disagree on behavior, the HTML wins, as always.*

---

## 1. Shape and stack

Same single-screen app as the iOS calc-only plan §1: jackpot cards, take-home results,
collapsible winning-numbers and tax-table sections, theme picker in the top app bar menu.

- **Kotlin + Jetpack Compose**, single-activity. Min SDK 26 (Android 8), target latest.
- **Zero third-party dependencies.** Android ships what this app needs: `HttpsURLConnection`
  (wrapped in coroutines on `Dispatchers.IO`) for the three GETs, built-in `org.json` for
  parsing, `SharedPreferences` for persistence. No Retrofit/OkHttp/Moshi — the app makes
  three simple GET requests; don't add an HTTP stack for that.
- **No charts** (same as iOS calc-only — the biggest simplification of this scope).
- New repo folder **`~/claude-lottery-android`** (one folder per GitHub repo, not in
  iCloud-synced paths). Structured so a future portfolio screen is additive, same principle
  as the iOS plan.

## 2. What maps to what (web → Android)

| Web concept | Android replacement |
|---|---|
| `localStorage` | `SharedPreferences` — **same key names** as the web/iOS list in iOS calc plan §2 |
| `fetch()` | `HttpsURLConnection` + coroutines; set `Origin: https://eagleadams86.github.io` on the Worker request (same fix, same reason — it's an HTTP header, not a browser concept) |
| CSS theme variables | Compose: a `LotteryColors` data class + `staticCompositionLocalOf`; 7 instances transcribed from `theme.css`. Don't force these into Material's `ColorScheme` slots — carry the palette directly, use Material components with explicit colors |
| Collapsible sections | `AnimatedVisibility` + clickable headers |
| Colored number balls | `Box` with `CircleShape` background |
| Shorthand input (`325M`) | Port `parseField` to Kotlin |
| System back gesture | Default behavior is fine (single screen) |

Also identical to iOS calc plan §2: keep writing `lottery-net-takehome` after each
calculation (one line, future portfolio handoff), drop "Recent changes", compute next-draw
dates in `ZoneId.of("America/New_York")` via `java.time`.

## 3. Architecture

```
app/src/main/java/.../lotterycalc/
├── LotteryApp.kt / MainActivity.kt      Compose entry, theme injection
├── theme/Theme.kt                       7 palettes
├── engine/TaxMath.kt, DrawSchedule.kt   pure Kotlin, unit-tested (JVM tests, no device)
├── net/JackpotService.kt, WinningNumbersService.kt, CachedFetch.kt
└── ui/CalculatorScreen.kt, JackpotCard.kt, WinningNumbers.kt, TaxBreakdown.kt
```

Engine classes are pure Kotlin with no Android imports — they unit-test on the JVM
(`./gradlew test`, no emulator) and could be shared with a future KMP setup if both
platforms ever get built (don't design for that now; just keep the engine Android-free).

## 4. Build order

Same five phases as the iOS calc-only plan §4 — scaffold+themes, engine+tests, offline UI,
live data, polish — with the same property that phases 1–3 need no network. Android-specific
notes per phase:

- Phase 1: Android Studio's emulator replaces the iOS simulator; any Pixel image works.
- Phase 2: tests run with `./gradlew test` on the JVM — faster feedback than iOS.
- Phase 4: add the `INTERNET` permission to the manifest (the one manifest entry needed).
- Phase 5: launcher icon via Android Studio's Image Asset tool (adaptive icon, Midnight
  palette ball motif); themed/monochrome icon variant is a nice extra.

**Stretch goals:** a home-screen **widget** (Glance API — Compose-style widgets) showing
jackpots + next draw, and a draw-night notification. Same ranking as iOS: the widget is
arguably the best form of the product.

## 5. Distribution — Android's good news

This is where Android beats iOS for a personal app:

| Route | Cost | Reality |
|---|---|---|
| **Sideload the APK** | $0 | Install once via USB (or share the APK file to the phone), **works forever** — no 7-day expiry, no re-signing. Enable "Install unknown apps" once |
| Play Store | $25 one-time | Only worth it for public distribution. Note: new personal Play accounts must run a closed test with 12 testers for 14 days before production release — a real hurdle; skip unless you actually want strangers installing it |

For a personal app: build a release APK, install it, done. No developer account of any
kind required. (App-review framing is moot when sideloading, but if Play ever happens:
same "tax calculator, not gambling" positioning as iOS plan §8.)

**Prerequisites:** Android Studio (free, macOS build available, ~4 GB), an Android phone
with USB debugging enabled (Settings → About → tap Build number 7×, then Developer
options → USB debugging) — or just the emulator until you want it on a phone.
