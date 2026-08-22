/* ═══════════════════════════════════════════════════════════════════════════
   tax.js — the tax engine both lottery pages share.

   WHY THIS IS A FILE and not two copies of a constants block. Until 2026-08-22
   the calculator applied a flat 37% federal rate and the portfolio carried
   three hard-coded effective rates of its own. Both were right for a jackpot
   and wrong for everything smaller, and — more to the point — they were the
   same tax law written down twice, in two files, with nothing to keep them in
   step. Rates move every year. One file, loaded by both pages, is the only
   arrangement where next January's edit cannot land in one page and miss the
   other.

   It is a plain classic script, not a module: these are single-file, no-build
   pages, `script-src 'self'` already admits it, and the declarations below
   become globals the way the rest of each page's code expects. It is on the
   service worker's SHELL list, so it is there offline like the pages are.

   WHAT IT ASSUMES, all of which the pages say on screen:
   • The prize is your ONLY income for the year. A salary on top pushes you
     further up the same brackets, so every figure here is a floor.
   • The standard deduction, not itemised deductions.
   • Today's brackets apply to every future annuity payment — i.e. that the
     bands keep pace with inflation, which is what indexing them is for.
     Nobody knows 2055's tax table; assuming this year's is the honest choice
     and it is stated rather than hidden.
   • No credits, no other adjustments, and no FICA — lottery winnings are
     ordinary income but not earned income, so no payroll tax applies.
   ═══════════════════════════════════════════════════════════════════════════ */

var TAX_YEAR = 2026;

/* Each table is [top of band, rate], the last band capped at Infinity.
   Federal: IRS Rev. Proc. 2025-32 (the 2026 inflation adjustments). */
var FED_BRACKETS = {
  single: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24],
           [256225, 0.32], [640600, 0.35], [Infinity, 0.37]],
  mfj:    [[24800, 0.10], [100800, 0.12], [211400, 0.22], [403550, 0.24],
           [512450, 0.32], [768700, 0.35], [Infinity, 0.37]]
};
var FED_STD = { single: 16100, mfj: 32200 };

/* New York State, 2026 tax year. The bottom five rates are 0.1 point lower
   than 2025's — the FY2026 budget cut 4/4.5/5.25/5.5/6 to 3.9/4.4/5.15/5.4/5.9.
   The three top bands (6.85 / 9.65 / 10.3 / 10.9) are the temporary high-earner
   brackets, extended through 2032. */
var NY_BRACKETS = {
  single: [[8500, 0.039], [11700, 0.044], [13900, 0.0515], [80650, 0.054],
           [215400, 0.059], [1077550, 0.0685], [5000000, 0.0965],
           [25000000, 0.103], [Infinity, 0.109]],
  mfj:    [[17150, 0.039], [23600, 0.044], [27900, 0.0515], [161550, 0.054],
           [323200, 0.059], [2155350, 0.0685], [5000000, 0.0965],
           [25000000, 0.103], [Infinity, 0.109]]
};

/* New York's TAX BENEFIT RECAPTURE (Tax Law s601(d-1)), and the one piece of
   this file that is a deliberate approximation rather than a table.

   Above $107,650 of New York AGI the state claws back the benefit of having
   had your lower income taxed at the lower rates, phased in over the $50,000
   above each bracket threshold, until the WHOLE of your taxable income is
   taxed at the top rate you reached. At the top of the table the statute says
   so outright: over $25,000,000 the supplemental tax is "the difference
   between the product of 10.90 percent and New York taxable income and the tax
   table computation" — which is a flat 10.9% on everything, and is exactly
   what a jackpot winner pays.

   Modelled here as that general rule rather than as the six per-status
   worksheets NY prints, because the worksheets are re-issued every year and
   the rule they implement is stable. It is exact at the top band (the case
   this app exists for) and within a few hundred dollars in the middle. It is
   never LOWER than the bracket computation, so it cannot flatter the answer.

   This is why the state figure is not simply 10.9% any more: a $500,000 share
   is a 6.85% prize in New York, not a 10.9% one, even though 10.9% was
   withheld from it. */
var NY_RECAPTURE_FLOOR = 107650;
var NY_RECAPTURE_PHASE = 50000;

/* New York City resident tax, for the NYC option. Yonkers instead charges a
   surcharge on your state tax rather than a rate of its own. */
var NYC_BRACKETS = {
  single: [[12000, 0.03078], [25000, 0.03762], [50000, 0.03819], [Infinity, 0.03876]],
  mfj:    [[21600, 0.03078], [45000, 0.03762], [90000, 0.03819], [Infinity, 0.03876]]
};
var YONKERS_SURCHARGE = 0.1675;

/* Withholding at the moment the cheque is written. Federal is 24% on any
   gambling prize of $5,000 or more. New York withholds at 10.9% — by law the
   state's HIGHEST effective rate (20 NYCRR 171.11), regardless of what you
   will actually owe. That asymmetry is the whole reason this app shows
   "withheld" and "settled at filing" as two different numbers, and now that
   the state side is computed properly it is also why a smaller prize produces
   a state REFUND rather than a further bill. */
var FED_WH = 0.24;
var NY_WH  = 0.109;
var WH_FLOOR = 5000;

/* Investment income, for the portfolio page. */
var LTCG_BRACKETS = {
  single: [[49450, 0], [545500, 0.15], [Infinity, 0.20]],
  mfj:    [[98900, 0], [613700, 0.15], [Infinity, 0.20]]
};
var NIIT_RATE = 0.038;
var NIIT_FLOOR = { single: 200000, mfj: 250000 };

var FILING_STATUSES = ['single', 'mfj'];
var RESIDENCES = ['ny', 'nyc', 'yonkers'];

/* ── The engine ──────────────────────────────────────────────────────────── */

/* Normalise anything that arrives from a stored preference or a share link.
   Both are attacker-controlled in the sense that matters — a hand-edited link
   is the whole point of the share feature — so nothing downstream indexes a
   table with a string it hasn't checked. */
function filingStatus(s) { return FILING_STATUSES.indexOf(s) >= 0 ? s : 'single'; }
function residence(s) { return RESIDENCES.indexOf(s) >= 0 ? s : 'ny'; }

/* Tax on `taxable` under a [cap, rate] table. Guards on <= 0 rather than
   trusting the caller: a prize smaller than the standard deduction is a real
   input, and without this it would return a negative tax. */
function bracketTax(taxable, table) {
  if (!(taxable > 0)) return 0;
  var tax = 0, floor = 0;
  for (var i = 0; i < table.length; i++) {
    var cap = table[i][0], rate = table[i][1];
    if (taxable <= floor) break;
    tax += (Math.min(taxable, cap) - floor) * rate;
    floor = cap;
  }
  return tax;
}

/* The band `taxable` lands in: its lower edge and its rate. The lower edge is
   what the recapture phase-in is measured from. */
function bandAt(taxable, table) {
  var floor = 0;
  for (var i = 0; i < table.length; i++) {
    if (taxable <= table[i][0]) return { floor: floor, rate: table[i][1] };
    floor = table[i][0];
  }
  return { floor: floor, rate: table[table.length - 1][1] };
}

function fedTax(income, status) {
  status = filingStatus(status);
  return bracketTax(income - FED_STD[status], FED_BRACKETS[status]);
}

/* New York taxable income is not reduced by the FEDERAL standard deduction —
   the state has its own, smaller one — but the state deduction is immaterial
   beside a lottery prize and leaving it out errs upward, which is the safe
   direction for a figure someone might budget against. */
function nyTax(income, status) {
  status = filingStatus(status);
  var table = NY_BRACKETS[status];
  var base = bracketTax(income, table);
  if (income <= NY_RECAPTURE_FLOOR) return base;
  var band = bandAt(income, table);
  var flat = income * band.rate;
  var phase = Math.min(1, Math.max(0, (income - band.floor) / NY_RECAPTURE_PHASE));
  return base + (flat - base) * phase;
}

function nycTax(income, status) {
  status = filingStatus(status);
  return bracketTax(income, NYC_BRACKETS[status]);
}

/* Every tax on one year's ordinary income of `income` dollars.
   Returns dollars, never rates: the effective rate is derived by the caller,
   because at small prizes it is a much smaller number than any table here. */
function ordinaryTax(income, status, where) {
  status = filingStatus(status);
  where = residence(where);
  var fed = fedTax(income, status);
  var ny = nyTax(income, status);
  var city = where === 'nyc' ? nycTax(income, status) : 0;
  var yonkers = where === 'yonkers' ? ny * YONKERS_SURCHARGE : 0;
  return {
    fed: fed, ny: ny, city: city, yonkers: yonkers,
    local: city + yonkers,
    total: fed + ny + city + yonkers
  };
}

/* Withholding on a single payment. Nothing is withheld below $5,000, which is
   why a split among enough winners can leave every share untouched at source
   and settled entirely at filing. Local tax is never withheld from a lottery
   prize by the state's payer, so an NYC winner's city tax is always a bill. */
function withholding(payment) {
  if (!(payment >= WH_FLOOR)) return { fed: 0, ny: 0, total: 0 };
  var fed = payment * FED_WH, ny = payment * NY_WH;
  return { fed: fed, ny: ny, total: fed + ny };
}

/* One payment, all the way through: what is kept at source, what the year
   actually costs, and which way the difference goes. `settle` is positive when
   you owe more at filing and negative when it comes back as a refund — the
   refund case did not exist while the state side was a flat 10.9%. */
function payoutYear(payment, status, where) {
  var wh = withholding(payment);
  var tax = ordinaryTax(payment, status, where);
  return {
    gross: payment,
    whFed: wh.fed, whNY: wh.ny, whTotal: wh.total,
    fed: tax.fed, ny: tax.ny, city: tax.city, yonkers: tax.yonkers,
    local: tax.local, tax: tax.total,
    settle: tax.total - wh.total,
    afterWH: payment - wh.total,
    net: payment - tax.total,
    eff: payment > 0 ? tax.total / payment : 0
  };
}

/* ── Annuities ───────────────────────────────────────────────────────────── */

/* Powerball and Mega Millions both pay an advertised jackpot as 30 payments —
   one immediately and 29 more a year apart — each 5% larger than the one
   before. New York Lotto pays 26 equal ones. Those two shapes are the only
   ones in the app, and a game names which it uses.

   The first payment is therefore NOT the jackpot divided by 30: it is the
   jackpot divided by the sum of the growth factors, which for 30 payments at
   5% is 66.44. Getting that wrong overstates the first cheque by a third. */
var ANNUITY_PLANS = {
  graduated30: { n: 30, growth: 0.05 },
  equal26:     { n: 26, growth: 0 }
};

function annuitySchedule(advertised, plan) {
  var p = ANNUITY_PLANS[plan] || ANNUITY_PLANS.graduated30;
  if (!(advertised > 0)) return [];
  var factors = [], sum = 0, i;
  for (i = 0; i < p.n; i++) { var f = Math.pow(1 + p.growth, i); factors.push(f); sum += f; }
  var first = advertised / sum;
  var out = [];
  for (i = 0; i < p.n; i++) out.push(first * factors[i]);
  return out;
}

/* Present value of a stream whose first element is paid today.
   The discount rate is the user's, and it is the whole argument between the
   two options: at 0% the annuity's bigger headline always wins, and there is
   some rate above which the lump sum always does. */
function presentValue(payments, rate) {
  var pv = 0;
  for (var i = 0; i < payments.length; i++) pv += payments[i] / Math.pow(1 + rate, i);
  return pv;
}

/* ── Investment income, for the portfolio ────────────────────────────────── */

/* The marginal rate a dollar of long-term capital gain or qualified dividend
   meets, given how much other income is already stacked under it. NIIT rides
   on top once total income clears the threshold — and that threshold is NOT
   indexed, which is why it is a flat number here and not a bracket table. */
function ltcgRate(income, status) {
  status = filingStatus(status);
  var band = bandAt(Math.max(0, income), LTCG_BRACKETS[status]);
  var niit = income > NIIT_FLOOR[status] ? NIIT_RATE : 0;
  return band.rate + niit;
}

/* The marginal rate the NEXT dollar of ordinary income meets — what a dollar
   of money-market interest actually costs, rather than an assumed top bracket. */
function ordinaryMarginalRate(income, status, where) {
  status = filingStatus(status);
  where = residence(where);
  var a = ordinaryTax(income, status, where);
  var b = ordinaryTax(income + 1, status, where);
  return b.total - a.total;
}

/* The STATE-and-local marginal rate only — no federal. Capital gains are
   ordinary income to New York, so a portfolio selling shares pays this on the
   gain on top of the federal long-term rate. Split out rather than folded into
   ordinaryMarginalRate() because that one includes federal, and adding it to
   ltcgRate() would charge federal ordinary rates on a long-term gain. */
function stateMarginalRate(income, status, where) {
  status = filingStatus(status);
  where = residence(where);
  var lo = ordinaryTax(income, status, where), hi = ordinaryTax(income + 1, status, where);
  return (hi.ny + hi.local) - (lo.ny + lo.local);
}
