# Remaining Commodity Provider Research

Research only. No implementation, no env vars, no providers added. Verified against
provider/institutional sources (Sept 2026). PRA pricing is sales-gated, so figures are
ranges/qualitative. OEML accepts 1–2 day stale data; priority order is semantic
correctness → commercial/public-display rights → reliability → coverage → cost.

Covers the 8 unresolved commodities: Tin, Lithium, Iron Ore, Rare Earth Elements,
Manganese, Barite, Columbite-Tantalite/Coltan, Bitumen. (Gold/Copper/Lead/Zinc/Brent are
already strong and out of scope.)

## Executive recommendation
Two tracks, split on legality + cost:

- **Track 1 — free, redistribution-legal, monthly (do first):** Iron Ore and Tin are
  published by the **World Bank "Pink Sheet"** and **IMF Primary Commodity Prices** —
  monthly, reuse-with-attribution (World Bank datasets CC BY 4.0; IMF reuse w/
  attribution). These are the true vendors behind most Nasdaq Data Link commodity
  series. Ideal for the stale-tolerant model; trade-off is monthly cadence (label
  honestly).
- **Track 2 — licensed PRAs, sales-only, paid:** Lithium, Rare Earths, Manganese,
  Barite, Coltan/Tantalum, Bitumen have no free benchmark. **Fastmarkets** is the
  broadest single fit; **Benchmark Mineral Intelligence** is the lithium + rare-earths
  specialist; **Argus** leads bitumen. For all of these, an API subscription alone does
  NOT grant public-display or derived-data rights — a separate license is required.

## Commodity-by-commodity matrix
| Commodity | Best source | Instrument type | Freq | Public-display legal? | Cost | Verdict |
|---|---|---|---|---|---|---|
| Iron Ore | World Bank/IMF (62% Fe CFR China) | Physical index (spot, CFR China) | Monthly | ✅ w/ attribution | Free | **APPROVE** |
| Tin | World Bank/IMF (LME refined) | LME cash spot, republished | Monthly | ✅ w/ attribution | Free | **APPROVE** |
| Lithium | Fastmarkets or Benchmark | Physical assessment (carbonate/hydroxide) | Daily/weekly | ⚠️ display license only | Paid, sales-only | **APPROVE IF LICENSED** |
| Rare Earths | Benchmark (or Fastmarkets) | Physical assessment (per oxide) | Weekly | ⚠️ display license only | Paid, sales-only | **APPROVE IF LICENSED** |
| Manganese | Fastmarkets (Mn ore index) | Physical index | Weekly | ⚠️ display license only | Paid, sales-only | **APPROVE IF LICENSED** |
| Barite | Fastmarkets (MB-BAR) | Physical assessment | Monthly | ⚠️ display license only | Paid, sales-only | **APPROVE IF LICENSED** |
| Coltan/Tantalum/Niobium | Fastmarkets (tantalite/ferro-niobium) | Physical assessment (thin) | Monthly | ⚠️ display license only | Paid, sales-only | **RESEARCH FURTHER** |
| Bitumen | Argus (regional) | Physical assessment (regional) | Weekly | ⚠️ display license only | Paid, sales-only | **APPROVE IF LICENSED** (pick region) |

## Fastmarkets
Leading physical-commodity PRA (IOSCO-aligned); broadest single fit for OEML's
minor/industrial minerals.
- **Coverage:** Lithium (carbonate & hydroxide), Manganese ore index, **Barite**
  (confirmed live codes, e.g. `MB-BAR-0018` "drilling grade, unground lump, API, SG 4.10,
  FOB China, $/tonne"; also Chennai/Vietnam/Morocco, monthly), Tantalum/Niobium
  (tantalite ore, ferro-niobium), Iron ore 62% Fe index. Bitumen: weak (Argus/Platts
  territory).
- **API:** Fastmarkets Physical Prices API — OAuth Bearer-token auth (scope
  `fastmarkets.physicalprices.api`); returns low/mid/high, assessment dates, revision
  history, optional rationale/forward curves, instrument metadata.
- **Licensing (critical):** API docs contain NO display/redistribution grant. Public
  display and derived data require SEPARATE contractual licensing beyond API access.
  Attribution required when licensed.
- **Pricing:** Enterprise, contact-sales only.

## Benchmark Mineral Intelligence
Specialist PRA for battery & critical minerals; 2,500+ assessments, IOSCO Type 2 audited,
publishes BMR benchmark statements.
- **Coverage:** Lithium (carbonate & hydroxide — market-standard) and independent Rare
  Earth prices (+ REE/magnet forecasts). Strongest single home for lithium + rare earths.
- **API:** Yes, enterprise-wide basis (charts, watchlists, export/integration).
- **Licensing (critical):** Redistribution/public-display terms not published; enterprise
  contract governs. Assume internal-use by default; public display + derived data need
  explicit contractual permission. Attribution required.
- **Pricing:** Enterprise, contact-sales only.

## Nasdaq Data Link
A delivery platform (ex-Quandl), NOT a data originator — the vendor, not "Nasdaq,"
determines rights.
- **Iron Ore / Tin:** the relevant free series trace to World Bank (Pink Sheet) and IMF
  Primary Commodity Prices — iron ore 62% Fe fines CFR China and tin (LME, refined),
  monthly. Rights follow the originator (World Bank CC BY 4.0 / IMF reuse-with-attribution).
  Consume directly from World Bank/IMF and skip Nasdaq.
- **Lithium:** not covered by World Bank/IMF; no clean free lithium series on Nasdaq.
- **LME-priced series caveat:** datasets sourced directly from LME carry LME's own
  redistribution/display licensing. The World Bank/IMF monthly figures are the
  institution's own re-licensed republication, which is why those are safe with
  attribution — a key distinction.
- **Verdict:** convenient but adds a middleman without adding rights; prefer the true
  vendor.

## Licensing / public-display analysis
Three separate rights — never conflate:
1. **Internal API usage rights** — use the numbers inside our systems. Granted by every
   API subscription here.
2. **Public website display rights** — show the price to anonymous visitors. NOT
   automatic for any PRA; requires an explicit display/redistribution license.
3. **Derived-data rights** — publish something computed from the price (indices, charts,
   transforms). Most restricted; a further contractual clause.

- **World Bank / IMF:** all three effectively available WITH attribution (World Bank CC
  BY 4.0; IMF reuse per its terms) — verify current dataset license at integration.
- **PRAs (Fastmarkets/Benchmark/Argus):** #1 yes; #2 and #3 require paid licensing +
  attribution.
- **LME-derived data:** direct LME data (incl. LME tin and the existing Metals.Dev LME
  copper/lead/zinc) needs an LME distribution license for public display — one reason
  Metals.Dev is currently gated. The World Bank/IMF monthly route sidesteps this for tin.

## Pricing
| Provider | Self-serve? | Published price? | Shape |
|---|---|---|---|
| World Bank Pink Sheet | Yes (download/API) | Free | $0, attribution |
| IMF Primary Commodity Prices | Yes (portal/API) | Free | $0, attribution |
| Nasdaq Data Link | Partly | Free tiers + paid premium | Varies by dataset vendor |
| Fastmarkets | No | No | Enterprise, sales-only |
| Benchmark Mineral Intelligence | No | No | Enterprise, sales-only |
| Argus (bitumen) | No | No | Enterprise, sales-only |

## Best source per commodity
- Iron Ore → World Bank/IMF 62% Fe CFR China (monthly, free, attribution); licensed daily
  alt: Fastmarkets 62% Fe index.
- Tin → World Bank/IMF tin (LME refined) monthly, free, attribution — legal shortcut
  around LME display licensing. (Also check whether Metals.Dev already exposes `lme_tin`.)
- Lithium → Fastmarkets or Benchmark.
- Rare Earths → Benchmark (or Fastmarkets).
- Manganese → Fastmarkets manganese-ore index.
- Barite → Fastmarkets (confirmed live assessments).
- Coltan/Tantalum → Fastmarkets minor-metals (verify exact instrument & thinness).
- Bitumen → Argus (regional; no single global bitumen benchmark).

## Sources rejected and why
- **Yahoo Finance** — no redistribution rights, futures ≠ our benchmarks, no gap
  coverage. Reject. (See `yahoo-finance-readiness.md`.)
- **Nasdaq Data Link as a data source** — delivery layer only; adds a middleman without
  conferring rights. Reject as originator.
- **LME direct for public display without a license** — needs an LME data license. Reject
  unless licensed (World Bank/IMF republication preferred for tin).
- **Commodity ETFs/equities (LIT, REMX, ZINC.L)** — equity baskets, not commodity price
  benchmarks; semantically wrong. Reject.
- **USGS Mineral Commodity Summaries** — authoritative and free, but annual, not a live
  price series. Reject as a price feed (usable as background only).

## Recommended next integrations
1. **Iron Ore + Tin via World Bank/IMF** — free, redistribution-legal (attribution),
   monthly. Cleanest, fastest win; fits the stale-tolerant model and OEML guardrails.
2. **Lithium via Fastmarkets or Benchmark** — most valuable licensed add; IOSCO-grade;
   paid display license. Benchmark if bundling rare earths.
3. **Manganese + Barite via Fastmarkets** — same contract vehicle as lithium.
4. **Rare Earths via Benchmark**, **Bitumen via Argus (regional)** — licensed; region/
   instrument to be pinned down.
5. **Coltan/Tantalum** — lowest priority; confirm instrument/liquidity or prefer an
   honest "by enquiry / unavailable" state over a thin monthly print.

### Per-commodity verdicts
- Iron Ore → **APPROVE** (World Bank/IMF)
- Tin → **APPROVE** (World Bank/IMF; verify Metals.Dev `lme_tin` alternative)
- Lithium → **APPROVE IF LICENSED** (Fastmarkets or Benchmark)
- Rare Earths → **APPROVE IF LICENSED** (Benchmark or Fastmarkets)
- Manganese → **APPROVE IF LICENSED** (Fastmarkets)
- Barite → **APPROVE IF LICENSED** (Fastmarkets)
- Bitumen → **APPROVE IF LICENSED** (Argus; regional)
- Coltan/Tantalum → **RESEARCH FURTHER** (Fastmarkets minor-metals)

**Key caveat throughout:** an API key grants internal use; public display and
derived-data rights are separate paid licenses for every PRA here — budget and contract
for them explicitly, as OEML already does for Metals.Dev.

## Sources
- Fastmarkets Physical Prices API: https://help.fastmarkets.com/apis_sub/fastmarkets-physical-prices-api
- Fastmarkets barite assessment (MB-BAR-0018): https://www.fastmarkets.com/commodity-prices/barite-drilling-grade-unground-lump-api-bulk-sg-4-10-fob-china-dollar-tonne-mb-bar-0018/
- Fastmarkets battery raw materials price data: https://www.fastmarkets.com/metals-and-mining/battery-raw-materials/price-data/
- Benchmark Mineral Intelligence — API: https://www.benchmarkminerals.com/api
- Benchmark — Rare Earths: https://www.benchmarkminerals.com/rare-earths
- Benchmark — Lithium prices: https://www.benchmarkminerals.com/lithium/prices
- World Bank Commodity Price Data (Pink Sheet): https://www.worldbank.org/en/research/commodity-markets
- IMF Primary Commodity Prices: https://www.imf.org/en/research/commodity-prices
- Nasdaq Data Link: https://data.nasdaq.com/
- LME market data / licensing: https://www.lme.com/Market-data
- Argus Bitumen: https://www.argusmedia.com/en/solutions/products/argus-bitumen
