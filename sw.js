'use strict';
/* NY Lottery — the offline service worker.
   ==========================================================================
   Ported from the financial-plan repo, where the design and its objections are
   recorded at length. Two of them matter here too, and one does not — this repo
   holds no records of anyone's, only preferences and cached feed data, which is
   why there is no schema halt beside this file the way the sibling apps have
   one. The two that do apply:

   1. THE PAGE'S CSP DOES NOT APPLY HERE. A worker takes its policy from the
      HTTP response headers of its own script, and GitHub Pages cannot set
      headers — so this code runs with NO Content-Security-Policy at all, and it
      runs resident, surviving reloads. That is why it is deliberately tiny, has
      no dynamic import, no eval, and never fetches anything cross-origin.
      Anything added here should be weighed as if it were running unsandboxed,
      because it is. Keep it short enough to read in one sitting.

   2. CACHE STORAGE IS ORIGIN-WIDE, NOT PER APP. Every app in the family shares
      eagleadams86.github.io, and `caches` is keyed by ORIGIN — so any page on
      that origin can read anything cached here, and the sibling workers
      (`fin-shell-`, `sv-shell-`, `td-shell-`, `gh-shell-`, `pap-shell-`) sit in
      the same store. The answer is the rule below: only files that are ALREADY
      PUBLIC in this repo are ever cached. Nothing an attacker could read from the cache
      is anything they couldn't read from GitHub. The theme, the slider
      positions and the cached jackpot figures stay in localStorage, which every
      page on the origin could already reach, so installing this changes that
      threat model not at all.
      It cuts the other way too: any same-origin page can also WRITE into this
      cache, so an XSS hole in a sibling app could poison the offline shell, and
      the poison outlives the hole. No per-cache ACL exists; the defence is the
      origin policy itself — a CSP on every page and no third-party script
      anywhere.

   The scope is this file's own directory. Widening it past `/lottery/`
   would need a `Service-Worker-Allowed` header, which Pages cannot send, so
   this worker structurally cannot reach the sibling apps.

   STRATEGY: NETWORK-FIRST, ALWAYS — the cache is a fallback for a network that
   actually failed, never a first choice. That is the whole answer to the
   failure this repo can least afford: stale cached code reading data whose
   shape has since moved. You can only ever be served cached code if the network
   genuinely did not answer, so a change landing while you are online is
   impossible to miss. It costs the speed a cache-first worker would buy, which
   was never the point — offline was.

   NO SCHEMA HALT HERE, deliberately, and this is the reason: the sibling apps
   need one because stale code can silently strip fields out of somebody's saved
   records and push the loss to their other devices. These two pages save no
   records. Every key they write is a preference (theme, game, winners, which
   sections are open, the sliders) or a cache of a public feed that refetches on
   the next load. Stale code here costs you a stale calculation for one visit,
   and the network-first rule above already makes that need a failed network.
   If either page ever starts saving something a user would miss, that decision
   comes with a version marker and a halt — see the sibling repos.

   If this worker ever misbehaves, it is sticky in a way a broken page is not —
   it can keep serving itself. `sw-kill.js` is the escape hatch: copy it over
   this file, push, and every installed copy uninstalls itself on next load. */

/* Bump when the shell list changes, so old caches are purged on activate. It is
   NOT load-bearing for freshness — network-first means a forgotten bump cannot
   serve you stale code — it only stops dead entries accumulating. */
const CACHE = 'lot-shell-v1';
const PREFIX = 'lot-shell-';

/* THE ALLOWLIST, and the security boundary of this file. Every entry is a file
   that is already public in the GitHub repo. Nothing else is EVER cached — not
   a jackpot reply, not the winning numbers, not the Treasury yield curve, not
   tests.html, not the repo's own notes. The three feeds are cross-origin and so
   are never even seen by this worker; caching a jackpot would also be wrong on
   its own terms, since a stale one is a wrong answer rather than an old page.
   A request that is not on this list is not intercepted at all: it goes to the
   network as if this worker did not exist. Adding a line here is a
   security decision, so justify it in the commit. */
const SHELL = [
  './',
  'ny-lottery-calculator.html',
  'lottery-portfolio.html',
  'theme.css',
  'privacy.html',
  'favicon.ico'
];

/* Resolved against this file's own URL, so the same list works unchanged on
   localhost (where the pages are at the root) and on Pages (where they are
   under /lottery/). Don't hard-code the directory. */
const ROOT = new URL('./', self.location).pathname;
const SHELL_PATHS = new Set(SHELL.map((p) => new URL(p, self.location).pathname));

/* The cache key for a request, or null if it isn't ours to touch. Returning a
   PATH rather than the request strips query strings, and that is load-bearing
   here rather than tidy: the markup asks for `favicon.ico?v=1` in two places,
   and without this the precached `favicon.ico` would never be the entry that
   answers it. `index.html` is folded onto './' for the same reason — both are
   the app, and a share link arriving at either one should work offline. */
function shellKey(url) {
  let p = url.pathname;
  if (p === ROOT + 'index.html') p = ROOT;
  return SHELL_PATHS.has(p) ? p : null;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Fill in whatever the cache is missing, and nothing it already has.
   Two bugs live here, both of which cost offline entirely and neither of which
   announces itself:

   • `cache.addAll` is ALL-OR-NOTHING. One 404 in the list — a file renamed, an
     asset not yet committed — rejects the whole call, install fails, and the
     app has no offline at all while looking perfectly healthy online. Fetching
     each entry on its own degrades instead: a missing file costs that file.

   • INSTALL FIRES ONCE PER SCRIPT VERSION. If the cache is later evicted (a
     browser reclaiming storage, or the user clearing part of their site data)
     the registration survives, no new install event ever runs, and the shell is
     never rebuilt — so offline quietly covers only whatever the last online
     visit happened to request. That is why the page pings this on every load
     (see the `message` handler): the repair has to be able to run without a new
     worker version to hang it on. */
async function topUp() {
  const cache = await caches.open(CACHE);
  await Promise.all(SHELL.map(async (p) => {
    const url = new URL(p, self.location);
    const key = self.location.origin + url.pathname;
    if (await cache.match(key)) return;
    try {
      /* `reload` so a top-up can't re-seed the cache from the HTTP cache's own
         stale copy — the one thing worse than an empty entry is a stale one. */
      const res = await fetch(url, { cache: 'reload' });
      if (res && res.ok && res.type === 'basic') await cache.put(key, res);
    } catch (_) { /* offline: nothing to top up with, try again next load */ }
  }));
}

self.addEventListener('install', (e) => {
  /* Precache up front so the FIRST offline open works, including for files this
     visit never happened to request. skipWaiting is safe here in a way it isn't
     under cache-first: the page already has its code, and all a new worker
     changes is where later fetches are answered from. */
  e.waitUntil(topUp().then(() => self.skipWaiting()));
});

/* The page asks for a shell check on every load, which is when it is most
   likely to be online and cheapest to repair. Nothing else is accepted, and
   nothing is read out of the message — the only thing a sender can do here is
   ask for files that are already public to be re-fetched. */
self.addEventListener('message', (e) => {
  /* Origin check first. A worker only ever controls same-origin clients and its
     scope is this app's own directory, so this cannot currently be reached from
     anywhere else — it is here because this file runs with NO CSP (Pages cannot
     send headers) and is resident, which is the whole reason it is written as
     defensively as it is. Flagged by CodeQL as js/missing-origin-check in all
     five workers on 2026-08-20; cheaper to satisfy than to keep re-deciding. */
  if (e.origin && e.origin !== self.location.origin) return;
  if (!e.data || e.data.type !== 'shell-check') return;
  e.waitUntil(topUp());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    /* ONLY this app's caches. `caches.keys()` is origin-wide, so an unguarded
       "delete everything that isn't mine" here would wipe a sibling app's
       cache — the shared origin cutting the other way. The
       prefix check is what keeps this worker inside its own app. */
    for (const k of await caches.keys()) {
      if (k !== CACHE && k.startsWith(PREFIX)) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  /* Cross-origin is never touched: the jackpot proxy, data.ny.gov and
     home.treasury.gov all go straight past. Those three are the whole point of
     being online, and they must fail honestly when you are not — a cached
     jackpot presented as current would be worse than no jackpot at all. */
  if (url.origin !== self.location.origin) return;
  const key = shellKey(url);
  if (!key) return;
  e.respondWith(networkFirst(req, key));
});

async function networkFirst(req, key) {
  const cache = await caches.open(CACHE);
  const cacheKey = self.location.origin + key;
  /* Read the cache BEFORE starting the fetch, so the handler below can consult
     it: a same-origin error page — a transient 404/500 from Pages mid-deploy —
     is a network that answered and still failed, and with a good copy in hand
     the shell should win. Only allowlisted shell files ever reach here, so no
     real missing page is being papered over. */
  const cached = await cache.match(cacheKey);
  const fresh = fetch(req).then((res) => {
    /* Only a real, same-origin 200 is worth keeping. `basic` excludes opaque
       cross-origin replies, which we should never see here anyway. */
    if (res && res.ok && res.type === 'basic') cache.put(cacheKey, res.clone());
    if (res && !res.ok && cached) return cached;
    return res;
  });
  /* Nothing to fall back to: let the network answer, or fail honestly. */
  if (!cached) return fresh;
  /* Offline rejects fast, but the case that actually matters is the slow, alive
     connection — hotel wifi, or a work VPN — where a plain network-first would
     hang for a minute with a perfectly good copy sitting in the cache. Five
     seconds, then serve what we have; the in-flight fetch still refreshes the
     cache behind it (race() has already attached handlers, so a later rejection
     is not unhandled). */
  return Promise.race([fresh, wait(5000).then(() => cached)]).catch(() => cached);
}
