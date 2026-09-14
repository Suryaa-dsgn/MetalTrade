# Market Provider Readiness

Operational record for the live market-data integration. Verified against real
API responses on 2026-09-14. Update this file whenever a plan, verified
capability, or commercial term changes.

## Multi-provider architecture (foundation)

```
UI → MarketService → BenchmarkRegistry → ProviderRouter → provider adapters
                  ↘ Normalization (Zod-validated) + sanity/units
                  ↘ MarketObservationRepository (last-known-good; in-memory now)
                  ↘ provider health + structured events
```

- **BenchmarkRegistry** (`lib/market/benchmarks.ts`) is the single source of
  routing truth. Commodity identity (slug) is separate from benchmark identity
  (`benchmarkId`, e.g. `gold-spot`, `copper-lme-3m`, `brent-crude`).
- **ProviderRouter** (`providers/router.ts`) maps a provider id to its adapter;
  not-yet-integrated providers resolve to null and the service falls back.
- **Repository** (`repository/`) holds last-known-good behind an interface; the
  in-memory implementation is per instance and does not survive a cold start (no
  database yet, by design).
- **Provider health** (`providers/health.ts`) is tracked separately from
  benchmark availability — a healthy provider can still omit a benchmark.
- Commercial/licensing terms are NOT in the registry (only a
  `publicDisplayApproved` gate); they live in this document.

### Provider assignments (approved)

| Commodity | Benchmark | Provider | Status |
|---|---|---|---|
| Gold | `gold-spot` | MetalpriceAPI | **live** (Free) |
| Copper | `copper-lme-3m` (LME Copper 3M) | Metals.Dev | planned — research/verify next |
| Lead | (separate) | Metals.Dev | planned |
| Zinc | (separate) | Metals.Dev | planned |
| Crude Oil | `brent-crude` (**Brent Crude**, named explicitly) | EIA | planned — after Metals.Dev |
| Lithium | `lithium-proxy` | MetalpriceAPI (paid) | sample; semantic review required |
| Lead-Zinc (combined slug) | — | — | never one blended number |
| Tin / Iron Ore / REE / Manganese / Coltan / Barite / Bitumen | — | — | paid-gated / proxy / no benchmark |

Commercial/redistribution terms for Metals.Dev and EIA must be confirmed by the
client for the chosen plan **before** `publicDisplayApproved` is set.

---

## EIA — Brent Crude (LIVE, Phase D2)

- **Provider:** `lib/market/providers/eia.ts`. **Status: LIVE and publicly displayed.**
- **Base:** `https://api.eia.gov/v2/petroleum/pri/spt/data/`. **Auth:** `api_key` **query param** (EIA requires it in the URL) — server-side only; **the URL is never logged and never appears in errors**.
- **Verified live (probe 2026-09-15):** series **`RBRTE`** (Europe Brent Spot Price FOB) → latest `period:"2026-09-09"`, `value:"109.51"` (**string**), `units:"$/BBL"`. USD **per barrel** (volume, not mass). `total` 9,974 rows since 1987; `dateFormat` YYYY-MM-DD; sort `period` desc + `length` = latest first. Bogus/empty series → HTTP 200, `total:0`, empty data → unavailable (no error).
- **Unit:** first **volume** benchmark. `bbl` is separate from the mass table; a bbl↔mass conversion is refused (never guessed). `providerUnit === canonicalUnit === "bbl"` → identity normalization.
- **Freshness:** daily official series that may lag a few days → `dailyBenchmark` policy (delayed, stale after 14d). UI shows "as of [period]", not real-time.
- **Commercial / public display:** EIA data is **public-domain U.S. Government data** — commercial use permitted **without a subscription or permission**, so `publicDisplayApproved: true`. This is why Brent is displayed live while Copper/Lead/Zinc are gated.
- **Attribution:** required acknowledgment, rendered from `EIA_ATTRIBUTION` in the data layer (compact "Source: U.S. Energy Information Administration" + a derived "as of [date]"). **No EIA logo.**
- **Brent vs WTI:** Brent (`RBRTE`) chosen as the single primary crude benchmark — international, seaborne FOB benchmark matching OEML's orientation. WTI (`RWTC`) not used (not a proxy, not blended).
- **Bitumen:** stays **unavailable** — WTI/Brent are **never** a Bitumen proxy.
- **History:** deep RBRTE daily history exists and is compatible (same series); the adapter is architected to add `getHistory` through the same contract, but the **Crude chart UI is deferred** (crude is per-barrel; the mass-only chart/stat/unit-toggle infra would need a volume path). D2 ships the **live Brent quote** only.
- **Rate limits:** EIA throttles per second/hour and temporarily suspends the key if exceeded (exact numbers not published); daily data + the 12h fetch-revalidate keeps usage trivial.
- **Env:** `EIA_API_KEY` (server-only). Free key from eia.gov/opendata.

---

## Metals.Dev (verified — Phase D2)

- **Provider:** `lib/market/providers/metalsdev.ts`. **Plan:** Free (probed 2026-09-14).
- **Base:** `https://api.metals.dev/v1`. **Auth:** `api_key` query param (server-side only; the URL is never logged).
- **Endpoint:** `GET /latest?currency=USD&unit=mt` → `{ status:"success", currency:"USD", unit:"mt", metals:{…}, currencies:{…}, timestamps:{ metal, currency } }`.
- **Verified live values (USD per metric tonne):** `lme_copper` ≈ **14,233**, `lme_lead` ≈ **1,897**, `lme_zinc` ≈ **3,872** (spot keys `copper`/`lead`/`zinc` also present and distinct — LME 3M is the `lme_*` key). **Unit `mt` = our canonical MT — no conversion needed.** As-of timestamp: `timestamps.metal` (ISO 8601 UTC).
- **Free tier includes LME data** — confirmed, not paid-gated.
- **History: NOT usable for industrial metals.** `/timeseries` returns **precious metals only, in `toz`** (gold/silver/platinum/palladium). There is **no LME Copper/Lead/Zinc history** via timeseries, so the quote (LME 3M) and any timeseries (precious/spot) are **incompatible and must not be merged**. Copper's chart therefore stays sample until a compatible real LME history source exists.

### Benchmark matrix (verified)
| Commodity | benchmarkId | Provider symbol | Spot/LME | Currency | Unit | History | Classification | Public display |
|---|---|---|---|---|---|---|---|---|
| Copper | `copper-lme-3m` | `lme_copper` | **LME 3M** | USD | mt | none (industrial) | exact | **LME Copper 3M reference benchmark** |
| Lead | `lead-lme-3m` | `lme_lead` | LME 3M | USD | mt | none | exact | **LME Lead 3M reference benchmark** |
| Zinc | `zinc-lme-3m` | `lme_zinc` | LME 3M | USD | mt | none | exact | **LME Zinc 3M reference benchmark** |

Never presented as OEML transaction/selling prices.

### Pricing (correction to D1)
| | Free | Copper plan |
|---|---|---|
| Price | $0 | **$1.79/mo** (annual billing = two months free; the ~$1.49/mo figure is only the effective annualized rate) |
| Quota | 100 req/mo | 2,000 req/mo |
| Updates | 60s | 60s |
| LME + all endpoints | included | included |

### Commercial / public display
Metals.Dev terms permit publishing rates on a website for commercial purposes **while an active subscription is maintained**. We treat a **paid subscription as the production requirement** and keep **`publicDisplayApproved = false`** until it is confirmed. Copper/Lead/Zinc are therefore **verified live but displayed as before** (Copper sample, Lead-Zinc in preparation).

### Go-live promotion (after a paid plan + commercial confirmation)
1. Confirm the paid Metals.Dev plan + commercial/public-display rights.
2. Copper: set `routing:"live"`, `publicDisplayApproved:true`, `freshnessPolicy: delayed15m`, `attribution: METALSDEV_ATTRIBUTION`; resolve the chart (no live LME history — show a no-data chart or source compatible history).
3. Lead-Zinc: promote `LEAD_ZINC_BENCHMARKS` (Lead + Zinc, `publicDisplayApproved:true`); render the two separate benchmarks on the profile — **never one blended price**; do not split the public catalogue unless required.
4. Widen/confirm sanity bands against live magnitudes; re-run the probe.
5. Invariant enforced by tests: `routing:"live"` requires `publicDisplayApproved`.

### Failure / partial mapping (implemented)
Invalid symbol / missing benchmark → omitted (partial, first-class → per-benchmark fallback); HTTP 401/403 → `auth`; 429 → `rate_limit`; 402 → `quota`; 400/422 → `bad_request`; malformed/Zod-invalid → `malformed`; timeout/network → `timeout`/`network`.

### Remaining Metals.Dev limitations (true, not shortcuts)
- No industrial/LME **history** (timeseries is precious-only) → no real Copper chart yet.
- **Commercial public display requires a paid subscription** → gated off until confirmed.
- Free quota 100/mo is tight; the $1.79/mo Copper plan (2,000/mo) is the production choice.

---

## MetalpriceAPI

## Current state

- **Provider:** MetalpriceAPI (`lib/market/providers/metalpriceapi.ts`).
- **Plan:** **Free.**
- **Active source:** mixed. Gold is a live benchmark; Copper and Lithium keep
  labelled sample data; the other nine commodities have no live benchmark
  ("in preparation"). Routing lives in `lib/market/benchmarks.ts`.
- **Activation:** `MARKET_PROVIDER=metalpriceapi` + `METALPRICE_API_KEY` set (in
  an untracked `.env.local`). With `MARKET_PROVIDER=mock` or no key, live-routed
  commodities fall back to labelled sample data (dev) or render unavailable
  (production) — never mock-presented-as-live.

## Verified working (Free tier)

| Capability | Status | Notes |
|---|---|---|
| Header auth (`X-API-KEY`) | ✅ | Key never in URL or logs. |
| `/latest` quotes | ✅ | `rates["USD"+symbol]` = USD per native unit. |
| Gold (`XAU`) | ✅ live | $4,348.21 / **troy ounce**, USD. Unit verified. |
| Source timestamp | ✅ | `timestamp` (UNIX) → as-of; EOD (23:59:59Z). |
| Retrieval timestamp | ✅ | Set by the adapter at fetch time. |
| Quota headers | ✅ | `x-api-quota` / `x-api-current` logged. **100 calls/month.** |
| Single-date history (`/YYYY-MM-DD`) | ✅ | Works, but quota-prohibitive for charts. |
| Error handling | ✅ | Typed codes; HTTP-200-with-`success:false` handled. |

## Paid-gated (NOT provider limitations — unlock on a paid plan)

| Capability | Error | Impact today |
|---|---|---|
| Base-metal quotes (`XCU`, `XSN`, `XPB`, `XLI`, `IRON`) | 416 "requires a paid plan" | Copper/Tin/Lead/Lithium/Iron-Ore stay sample / in-preparation. |
| Timeframe history > 5 days | 421 "requires a paid plan" | No live chart history; Copper chart stays sample. |
| `unit` override (troy_oz/gram/kilogram) | paid-only | Base-metal per-ounce → per-tonne is converted locally after verification. |
| Higher quota / lower delay | paid-only | Free = daily/EOD, 100 calls/month. |

**Paid-gated ≠ unsupported.** The instruments exist; the current plan cannot
fetch them.

## No suitable public benchmark (provider genuinely lacks it)

- **Manganese, Coltan (Ta/Nb), Barite, Bitumen** — no symbol. Stay in-preparation.
- **REE** — only `XND` (Neodymium), a single element, not the REE basket → proxy only.
- **Iron Ore** — `IRON` is quoted per ounce, a weak proxy for a per-dmt bulk
  commodity → needs a semantic decision, not just a paid plan.
- **Crude Oil** — WTI/BRENT exist (per barrel, volume not mass) → product decision
  + a non-mass unit path; out of scope for this metals pass.
- **Lead-Zinc** — `XPB` and `ZNC` are two separate benchmarks and must never be
  blended into one number; catalogue entry stays combined/in-preparation.

## Production upgrade workflow (no rewrite required)

1. Client upgrades the MetalpriceAPI plan (base metals + timeframe history).
2. Update `METALPRICE_API_KEY` in the production secret store if the key changes.
3. Run the live probe (`/latest?currencies=XCU,XSN,XPB,XLI,IRON`) and record the
   returned magnitudes.
4. For each base metal: confirm the returned value, under the troy-ounce basis,
   lands inside the `sanityBand` in `benchmarks.ts`. If it fits, add the symbol to
   `VERIFIED_UNITS` in the adapter, set `providerUnit`/`unitVerified: true` and
   `routing: "live"` in the registry. If it does not fit, keep it sample and
   investigate (troy vs avoirdupois, or a different denomination).
5. Lithium (`XLI`) needs an extra **semantic** check — confirm which physical
   lithium product it tracks before exposing it, even if a number returns.
6. Flip `PROVIDER_CAPABILITIES.metalpriceapi.plan`/capability flags.
7. For live chart history, implement `fetchHistory` on the provider (timeframe,
   ≤365-day chunks) and branch history sourcing in `getMetalDetail`.
8. `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, then the
   verification checklist below.

## Post-upgrade verification checklist

- [ ] `/markets` shows each newly-enabled commodity with a plausible price and a
      **Live benchmark** label (not "Sample").
- [ ] Units correct: base metals in USD/t within the sanity band; Gold in USD/oz.
- [ ] Source + retrieved timestamps populated; freshness accurate.
- [ ] Sanity guard: a deliberately wrong band renders unavailable, not a bad price.
- [ ] Provider failure path still degrades safely (last-known-good / unavailable).
- [ ] API key absent from `.next/static` and served HTML.
- [ ] Quota usage sustainable at the chosen cache interval.

## Known limitations (true, not shortcuts)

- **Free tier caps live data to Gold**; everything else is paid-gated or lacks a
  public benchmark. Documented above.
- **Last-known-good is per server instance** (in-memory) and does not survive a
  cold start; there is no database by design. The adapter's Next `fetch`
  revalidate (12h) softens this. Durable last-known-good is a future step.
- **No 24h/7d/30d change for live Gold** on Free (`/latest` omits change; a second
  call/endpoint would be needed) → shown as an em dash, never fabricated.
