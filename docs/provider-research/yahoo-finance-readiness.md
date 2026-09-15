# Yahoo Finance Market Data Readiness Report

Research only. No implementation; Yahoo is NOT added to the ProviderRouter. Verified
against Yahoo's own legal pages and current sources (Sept 2026). OEML accepts 1–2 day
stale data, so reliability, semantic correctness, and commercial/public-display
legality are prioritized over real-time speed.

## Official API status
There is **no official, supported public Yahoo Finance API.** Yahoo shut down its
original Finance API on **15 May 2017** and never replaced it — no signup, no key, no
supported contract, no SLA. Everything marketed as a "Yahoo Finance API" today is
either (a) undocumented internal endpoints, (b) third-party wrappers over them
(yfinance, yahooquery), or (c) unaffiliated resellers (RapidAPI). Yahoo's only
documented developer terms are the restrictive **Yahoo Developer API (YDN) Terms of
Use**.

## Undocumented endpoint risk
Live data comes from internal hosts (`query1/query2.finance.yahoo.com`), mainly
`/v8/finance/chart/{symbol}` (quote + history) and the older `/v7/finance/quote`,
`/v10/finance/quoteSummary`.
- **Auth by cookie + crumb:** since ~2023 these require a session `B` cookie plus a
  "crumb" token; missing/expired → HTTP 401. `v7/finance/quote` was blocked with 401s
  in late 2024/2025, pushing callers onto `v8/chart` with per-symbol requests.
- **No stability guarantees:** schema drift, symbol changes, rate-limiting and IP
  blocking without notice. Datacenter IPs (the OEML deploy target) are more likely to
  be throttled/blocked than a residential browser.
- **Risk: HIGH** for unattended production use.

## Commercial-use assessment
| Approach | What it is | Risk |
|---|---|---|
| Official Yahoo API | Does not exist (since 2017) | N/A |
| Undocumented endpoints | Internal calls, cookie+crumb, no docs | **High** — Yahoo ToS: no redistribution, no automated access without written permission; YDN terms bar selling/sharing/deriving income from the APIs |
| Third-party wrappers (yfinance) | Open-source scrapers | **High + explicit disclaimer** — yfinance is "not affiliated… intended for research and educational purposes," and "the Yahoo! finance API is intended for personal use only" |

Compounding: much Yahoo data is **licensed from exchanges** (CME/ICE/LME), whose
licenses independently restrict redistribution/public display. A commercial public
site displaying Yahoo data faces **two** layers of legal exposure.

## Commodity coverage matrix (12 OEML commodities)
Only 4 of 12 have any Yahoo instrument, and **all four are futures**, not our
spot/LME/EIA benchmarks.

| Commodity | Usable Yahoo benchmark? | Notes |
|---|---|---|
| Gold | ⚠️ Futures only | `GC=F` COMEX gold future (≠ spot XAU) |
| Copper | ⚠️ Futures, wrong basis | `HG=F` COMEX copper (**not** LME 3M) |
| Crude/Brent | ⚠️ Futures only | `BZ=F` Brent future (**not** EIA spot) |
| Iron Ore | ⚠️ Thin futures | `TIO=F` CME/NYMEX TSI 62% Fe swap future |
| Tin | ❌ None | LME-only |
| Lead | ❌ None | LME-only |
| Zinc | ❌ None | LME-only (`ZINC.L` is an ETC, not a price) |
| Lithium | ❌ None | `LIT` is an equity basket, not a price |
| Rare Earths | ❌ None | `REMX` is an equity basket, not a price |
| Manganese / Barite / Coltan | ❌ None | No instrument |

## Exact ticker matrix (usable instruments)
| Ticker | Instrument | Exchange | Spot/Futures | Contract | Currency | Unit | Delay | History |
|---|---|---|---|---|---|---|---|---|
| `GC=F` | Gold front-month future | COMEX (CME) | Futures | Front-month continuous | USD | troy ounce | ~10 min | Yes, years |
| `HG=F` | Copper front-month future | COMEX (CME) | Futures | Front-month continuous | USD | **per pound** | ~10 min | Yes |
| `BZ=F` | Brent "Last Day Financial" future | NYMEX/CME (ICE-settled) | Futures | Front-month continuous | USD | per barrel | ~10 min | Yes |
| `TIO=F` | Iron Ore 62% Fe CFR China (TSI) swap future | NYMEX/CME | Futures (cash-settled to TSI) | Front-month continuous | USD | metric tonne | delayed; thin | Yes, sparser |

All `=F` are **continuous front-month** series (Yahoo rolls them) → roll discontinuities
and contango/backwardation basis.

## Units
`GC=F` USD/troy oz; `HG=F` USD/**pound** (LME copper is USD/tonne); `BZ=F` USD/barrel;
`TIO=F` USD/tonne. No unit exists for tin/lead/zinc/lithium/manganese/REE/barite/coltan
because there is no instrument.

## Freshness
Live quotes are exchange-delayed ~10 min. **Daily EOD history** via `v8/chart` is the
most stable offering — which suits the 1–2 day tolerance — but is still bound by the
same ToS/redistribution limits.

## Historical capability
Multi-year daily OHLC for the 4 instruments that exist; continuous-front-month roll
artifacts apply; `TIO=F` is thinner/gappier. **Does not fill the real gaps** (tin, lead,
zinc, lithium, manganese, REE, barite, coltan have no instrument).

## Yahoo vs current providers
- **Gold — `GC=F` vs MetalpriceAPI (XAU):** same unit, different instrument (COMEX
  futures vs spot). Spot is the more correct "reference price" and is already live.
- **Copper — `HG=F` vs Metals.Dev LME 3M:** different exchange, different unit (lb vs
  tonne), different basis; COMEX–LME spread is large. **`HG=F` must never be labelled
  LME Copper 3M.**
- **Brent — `BZ=F` vs EIA RBRTE:** exchange-traded futures vs EIA physical spot
  assessment; only EIA is public-domain and legally clean. **`BZ=F` must never be
  treated as RBRTE.**

## Best use cases
- **A. Primary public data → No.** Unstable, ToS personal-use-only, futures ≠ our
  benchmarks.
- **B. Fallback public data → No.** A fallback still displays publicly; same
  ToS/semantic problems, and would violate OEML's "never present one instrument as
  another" guardrail.
- **C. Historical charts (public) → No.** Public display = redistribution.
- **D. Internal validation / anomaly-checking only → the only arguably defensible use,**
  server-side, low-volume, never displayed or persisted for redistribution; even this
  is ToS-gray and endpoint-fragile, so non-authoritative and best-effort.

## Risks
Legal (Yahoo ToS + exchange licenses); operational (crumb/cookie 401s, deprecation,
schema drift, IP blocking, no SLA); semantic (all usable tickers are futures, high
mislabel risk); coverage (the interesting gaps — Tin/Lead/Zinc/Lithium — have no usable
Yahoo benchmark).

## Recommendation
**Do not add Yahoo Finance to OEML's public data path in any tier.** It fails on
legality, reliability, and semantics, and does not solve the gaps. The 1–2 day tolerance
does not rescue it: the blocker is legal/semantic, not latency.

| Candidate | Verdict |
|---|---|
| Undocumented endpoints / yfinance for production | **REJECT** |
| Gold `GC=F` | **INTERNAL VALIDATION ONLY** (spot already covered) |
| Copper `HG=F` | **INTERNAL VALIDATION ONLY** — never as an LME substitute |
| Brent `BZ=F` | **INTERNAL VALIDATION ONLY** (EIA is the clean source) |
| Iron Ore `TIO=F` | **HISTORY ONLY / INTERNAL VALIDATION ONLY**, until a licensed TSI/SGX source is evaluated |
| WTI `CL=F` (not in catalogue) | **REJECT** |
| Tin / Lead / Zinc / Lithium / REE / Manganese / Barite / Coltan | **REJECT** — no usable Yahoo benchmark |

**Next step (not implemented):** for the real gaps, evaluate licensed sources (LME-
authorized feeds, SGX/CME for iron ore, Fastmarkets/Benchmark for lithium) — see
`remaining-commodity-provider-research.md`.

## Sources
- Tiingo — Yahoo Finance API status/compliance: https://www.tiingo.com/blog/yahoo-finance-api/
- Scrapfly — Yahoo Finance API guide (crumb/cookie, v8): https://scrapfly.io/blog/posts/guide-to-yahoo-finance-api
- yfinance (GitHub, disclaimer & ToS links): https://github.com/ranaroussi/yfinance
- Yahoo Developer API Terms of Use: https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html
- Yahoo `HG=F` (COMEX Copper): https://finance.yahoo.com/quote/HG%3DF/
- Yahoo `BZ=F` (Brent Last Day Financial): https://finance.yahoo.com/quote/BZ=F/
- Yahoo `TIO=F` (Iron Ore 62% Fe TSI): https://finance.yahoo.com/chart/TIO=F/
- ICE Brent Crude Futures: https://www.ice.com/products/219/Brent-Crude-Futures
- INN — LME vs COMEX copper: https://investingnews.com/daily/resource-investing/base-metals-investing/copper-investing/lme-copper-price-comex-copper-price/
- PromptCloud — Yahoo scraping commercial risk: https://www.promptcloud.com/blog/scrape-yahoo-finance/
