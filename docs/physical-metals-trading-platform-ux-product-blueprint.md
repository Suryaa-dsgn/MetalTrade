# Physical Metals Trading & Market-Intelligence Platform

## Comprehensive UX / Product Blueprint

**Status:** Product and UX foundation for discovery, design, implementation, and launch QA  
**Product type:** Trust-first B2B website with market intelligence and structured trade enquiries  
**Primary outcome:** Connect verified physical-metal supply with qualified demand while making pricing, verification, and logistics capability credible and understandable.

> MVP should be a premium corporate platform, market-information layer, and lead-generation system. It should not assume public bids, checkout, payment, contract formation, or settlement on the site.

---

## 1. Product thesis

The client is not only selling copper, gold, lithium, or other metals. The client is selling access to qualified counterparties, confidence in material identity and documentation, market context, commercial coordination, and execution support.

The platform must answer two questions at once:

| Audience | Question | UX answer |
|---|---|---|
| Supplier / source | Why should I bring my material to you? | Show qualified demand, market context, structured review, and execution capability. |
| Buyer | Why should I source through you? | Show credible supply pathways, specification, evidence, inspection, logistics, and responsive human support. |

### Working positioning

- **Global metals. Verified counterparties. Reliable execution.**
- **Connecting trusted metal supply with qualified global demand.**
- **From source to buyer, with confidence at every stage.**

Final copy, claims, metrics, logos, certifications, and service promises must be validated by the client.

### Product principles

1. Evidence over adjectives: prefer grade, assay, origin, inspection, documents, terms, and process over “100% authentic.”
2. Two-sided clarity: every major page should help both a supplier and a buyer find a next step.
3. Benchmark is not transaction price: show source, timestamp, unit, currency, freshness, and caveat.
4. Human-assisted commerce: the website qualifies and routes demand; the client manages negotiation and execution.
5. Calm institutional quality: premium, industrial, precise, global, and controlled—not crypto-neon or generic SaaS.
6. Progressive disclosure: overview first, operational detail second.
7. Honest capability: never publish an unsupported service, number, compliance statement, or relationship.

## 2. Goals and non-goals

### Goals

- Explain the business within 10 seconds.
- Route users into **I Have Metal to Sell**, **I Want to Source Metal**, or **General Enquiry**.
- Establish trust without exposing confidential counterparties.
- Present useful market benchmarks and historical movement with clear provenance.
- Make the physical business visible: forms, grades, origins, quantities, ports, terms, inspection, and delivery.
- Capture commercially useful enquiries instead of vague contact messages.
- Give the client a maintainable content and market-data system.
- Create a foundation for a future authenticated portal without overbuilding it in MVP.

### Non-goals for MVP

- Anonymous public marketplace, live bids/offers, checkout, payment, wallet, settlement, or automatic trade execution.
- Financial advice, investment recommendations, trading signals, or guaranteed pricing.
- Public disclosure of exact stock locations, confidential buyer identities, or sensitive offers.
- Replacing the client’s CRM, compliance review, or operations workflow.

## 3. Users and roles

### External

**Supplier / source:** mine, refiner, processor, trader, stockholder, recycler, broker, or authorised representative. Needs qualified demand, fair market context, a professional review process, confidentiality, and a clear next step.

**Buyer:** manufacturer, refinery, processor, battery producer, infrastructure company, industrial buyer, commodity house, or authorised procurement representative. Needs relevant physical material, specification, provenance/document context, destination and terms coordination, and a fast path to a qualified human.

### Internal

- Trade/commercial team: qualifies and routes opportunities.
- Operations/logistics: validates route, freight, documents, and delivery feasibility.
- Compliance/risk: reviews KYC/KYB, sanctions, provenance, and restricted content.
- Content editor: manages pages, metals, FAQs, and insights.
- Market-data owner: monitors provider health, timestamps, units, and fallbacks.
- Leadership: reviews qualified pipeline and performance.

### Shared intent taxonomy

` sell_supply `, ` source_metal `, ` logistics_support `, ` general_enquiry `, ` media_or_partnership `.

---

## 4. Core journeys

### Supplier

1. Lands on Home or a metal page.
2. Sees the source → client → buyer model and evidence of serious demand.
3. Reviews relevant forms, grades, benchmark context, and process.
4. Selects **I Have Metal to Sell**.
5. Completes a structured supply form and uploads permitted documents.
6. Receives reference number, expected response time, and next steps.
7. Internal team receives routed lead, source page, campaign, consent, and attachments metadata.

### Buyer

1. Lands on a metal page or Markets.
2. Reviews benchmark, historical movement, physical forms, and assurance process.
3. Selects **I Want to Source Metal**.
4. Enters specification, quantity, destination, delivery timing, terms, and documentation needs.
5. Receives confirmation; commercial team qualifies and matches supply privately.

### Market visitor

1. Searches for a metal benchmark.
2. Confirms value, unit, currency, source, timestamp, and delayed/live state.
3. Uses chart ranges where available.
4. Understands benchmark versus negotiated physical price.
5. Converts interest into a supply or sourcing enquiry.

### Logistics visitor

1. Opens Trade & Logistics.
2. Understands lifecycle, modes, documents, responsibility boundaries, and Incoterms.
3. Submits origin, destination, quantity, commodity, timing, and route needs.

### Future repeat counterparty

Authenticated future portal: enquiries, documents, active trades, shipment milestones, notifications, and approved counterparties.

---

## 5. Information architecture

```text
Home
Markets
  ├── Market overview
  └── Metal detail template
Trade & Logistics
Company
Contact / Enquire
Trust & Compliance (recommended if substantive)
Insights (optional, only if maintained)
Legal: Privacy, Terms, Cookies, Accessibility
```

Recommended routes:

```text
/markets
/markets/[metal-slug]
/trade-logistics
/company
/contact
/enquire/supply
/enquire/buying-requirement
/enquire/logistics
/trust-and-compliance
/insights/[article-slug]
```

Persistent CTA: **Discuss a Requirement**. Contextual CTAs: **I Have Metal to Sell**, **I Want to Source Metal**, **Discuss Logistics**.

Future portal routes should remain private and authenticated: `/portal`, `/portal/enquiries`, `/portal/documents`, `/portal/shipments`, `/portal/notifications`.

---

## 6. Page-by-page UX specification

### 6.1 Home

**Job:** Explain the model, establish trust, show market activity, and route both audiences.

**Sections, in order:**

1. Header: logo, Markets, Trade & Logistics, Company, Contact, primary CTA.
2. Hero: “Connecting global metal supply with verified demand”; concise support copy; two audience CTAs; approved industrial/material visual.
3. Market ticker: 4–8 metals with value, unit, currency, change, timestamp, and status. Pause on hover/focus; not the only access to data.
4. What we trade: metal cards with image, forms, benchmark summary, and links.
5. How the network works: source → qualification/pricing/documentation/inspection/logistics → buyer.
6. Supplier proposition: qualified demand, benchmark context, structured review, and execution support.
7. Buyer proposition: defined specification, verified pathways, inspection, logistics, and trade support.
8. Trade assurance: counterparty qualification, material documentation, inspection, commercial verification, transport documents, delivery confirmation.
9. Logistics preview: lifecycle and supported modes/regions.
10. Network/proof: substantiated metrics, sectors, regions, or anonymised counterparties.
11. Final CTA: “Tell us what you have—or what you need.”
12. Footer: contact, legal, data disclaimer, approved social links.

**Acceptance:** A first-time visitor can explain the business without scrolling; both audience paths are visible immediately; trust claims have evidence or are omitted.

### 6.2 Markets overview

**Job:** Provide a searchable market overview that feels current without overpromising precision.

Sections: title and benchmark explanation; data status; search and filters; sortable table; mobile card alternative; featured metals; “how to read this” note; enquiry CTA.

Table fields: metal, value, 24h change, 7D change, 30D change, last updated, status. Preserve filters in URL query parameters. Use symbols plus text for positive/negative movement; do not rely on colour alone.

### 6.3 Metal detail template

**Above fold:** metal name/symbol/category, benchmark value, currency/unit selector, absolute and percentage change, “Market benchmark” label, provider, timestamp, live/delayed/EOD/unavailable status, and supply/buy CTAs.

**Chart:** ranges 1D, 7D, 1M, 3M, 1Y, 5Y subject to provider coverage; exact timestamp tooltip; keyboard-operable controls; accessible data-table alternative; loading, no-data, stale, and provider-error states. Avoid technical indicators in MVP.

**Market summary:** open, previous close, day range, 52-week range, and volume/open interest only where meaningful and licensed.

**Physical section:** approved material image; typical forms; grade, purity, assay, origin, packaging, MOQ, availability, inspection, documentation, Incoterms; applications; regions served; factors affecting physical price.

**Required disclaimer:**

> Displayed values are informational market benchmarks and may be delayed. They are not an offer, quote, investment recommendation, or guaranteed transaction price. Physical-metal pricing may vary by specification, quantity, origin, destination, logistics, inspection, and commercial terms.

### 6.4 Trade & Logistics

Hero: “From source to destination.” Lifecycle: trade confirmation, inspection, documentation, collection, inland transport, port/freight, customs, delivery. Capability cards: freight coordination, customs/documentation, inspection, warehousing, insurance, tracking—only where true. Explain supported road/rail/sea/air modes and approved Incoterms such as FOB, CIF, CFR, or EXW. Include scope boundaries, FAQ, and route enquiry CTA.

### 6.5 Company

Explain the company’s role in the value chain; source, evaluate, connect, negotiate, coordinate, deliver; material categories; regions; team if approved; trust/compliance approach; metrics or authorised logos; CTA.

### 6.6 Contact / Enquiry hub

Opening question: **How can we help?** Present four intent cards: sell metal, source metal, logistics support, general enquiry. Provide monitored phone/email only, response expectation, business hours, and privacy use.

### 6.7 Trust & Compliance

If the client can provide substance, explain counterparty qualification, KYC/KYB, beneficial ownership, sanctions/export review, provenance/responsible sourcing, assay/inspection, confidentiality, data handling, and limitations. Never reveal sensitive controls or make unsupported certifications.

### 6.8 Insights

Optional. Use for reviewed market notes, metal explainers, logistics/Incoterms guides, and responsible-sourcing content. Avoid unreviewed predictions, financial advice, and auto-generated commentary presented as expertise.

---

## 7. Enquiry forms

### Shared rules

- Use multi-step only when it reduces perceived complexity; show progress and allow back navigation.
- Labels above fields; required fields explicit; validate client and server side.
- Error summary at top and errors attached to fields.
- Appropriate mobile input types, keyboard operation, autocomplete, and screen-reader labels.
- Secure upload service with allowlist, size limits, malware scan, retention, and role-based access.
- Capture privacy acknowledgement and contact permission separately.
- Do not ask for passports, bank details, wallets, or other sensitive data in a public form unless counsel approves.

### Supplier form

Contact: company/legal entity, contact/name/role, email, phone, website, preferred contact. Material: metal, form/grade, purity/assay, quantity/unit, availability, origin/country/location, packaging, target price or discuss, destination, Incoterm. Documents: assay/certificate, title/ownership evidence, inspection, export status, permitted uploads, details. Review and consent.

### Buyer form

Company/legal entity, contact/role, email/phone, metal/form, grade/specification, quantity/frequency, destination, delivery window, preferred Incoterm, inspection/document requirements, optional target price context, end-use/category if needed, message, consent.

### Logistics form

Commodity/form, quantity/unit, origin/pickup, destination/delivery point, target date, mode, Incoterm, packaging/handling, documents, message, consent.

### Post-submit

Show reference number, expected response time, what happens next, and safe document guidance. Confirmation email should not repeat confidential uploads.

---

## 8. Trust, verification, and compliance UX

### Evidence hierarchy

1. Specific process.
2. Responsible team or partner.
3. Document/verification type.
4. Review/freshness date.
5. Scope and limitation.

Use language such as “We coordinate independent inspection where agreed in the transaction” and “Counterparty qualification may include KYB, beneficial ownership, sanctions, and document review.” Avoid “risk-free,” “guaranteed profit,” “100% authentic” without scope, and “verified buyer” when verification is incomplete.

### Decisions required from client/legal

Jurisdictions served/excluded; KYC/KYB responsibility; sanctions/export controls; responsible-minerals policy; anti-bribery statement; data/document retention; attachment visibility; market-data attribution; escalation and suspicious-activity handling.

---

## 9. Market/pricing UX and data contract

### Decisions before build

Metals; benchmark/provider; real-time/delayed/EOD; public/authenticated; currencies/units; historical coverage; informational versus contractual use; attribution and redistribution rights; API limits; fallback policy.

### Quote model

```ts
type MarketQuote = {
  metalId: string;
  value: number;
  currency: string;          // ISO 4217
  unit: string;              // MT, oz, lb, kg
  changeAbsolute?: number;
  changePercent?: number;
  asOf: string;              // ISO 8601 UTC
  receivedAt: string;        // ISO 8601 UTC
  status: 'live' | 'delayed' | 'eod' | 'stale' | 'unavailable';
  provider: string;
  attribution?: string;
  disclaimerVersion: string;
};
```

### Architecture

```text
Licensed provider(s) → server-side ingestion/normalisation → cache + freshness monitor
→ public API/server-rendered page → tables, cards, charts, SEO metadata
```

Never expose provider secrets in the browser or scrape a source without permission. Show last-known value with exact timestamp and **stale** label; never show fake zeros. Log provider errors and alert the internal owner.

---

## 10. Responsive and accessibility requirements

- Design for narrow phones, tablets, laptops, and wide monitors.
- Keep the key value and primary CTA visible in small-screen layouts.
- Convert dense tables into labelled cards or accessible horizontal scroll.
- Charts must be readable without hover and have a data-table/summary alternative.
- Forms must support touch, keyboard, paste, autofill, and mobile keyboards.
- Target WCAG 2.2 AA where applicable: semantic landmarks, heading hierarchy, visible focus, contrast, keyboard access, meaningful alt text, captions, reduced motion, labelled errors, and no colour-only status.
- Announce timezone, unit, currency, and freshness clearly.
- Avoid autoplay video and motion-heavy backgrounds.

---

## 11. Visual and content direction

### Character

Institutional, industrial, premium, precise, global, controlled.

### Visual system

Neutral foundation with restrained accent; real material photography; fine dividers; disciplined grids; large editorial type; tabular numerals; subtle metal-derived accents; restrained animation. Avoid neon fintech, candlestick overload, generic blue SaaS, and overdecorated metal-by-metal colour worlds.

### Content hierarchy

1. What the company does.
2. Why it is credible.
3. What metals/services are available.
4. What the market reference means.
5. How execution progresses.
6. What to submit next.

Photography must be approved and rights-cleared; generic imagery must not imply ownership, mine origin, or shipment access.

---

## 12. CMS/content model

### Metal

Name, slug, symbol/category, summary, hero image, forms, specifications, applications, regions, provider mapping, supported units/currencies, SEO fields, related insights, publication state, reviewed date, reviewer.

### Metal form/specification

Metal, form, grade, purity/assay, packaging, MOQ, availability, inspection/document requirements, public/private visibility.

### Service

Name, description, regions, limitations, CTA, reviewed date.

### Trust item

Claim, evidence/process, scope, owner, reviewed/expiry date, approval state, public copy.

### Market configuration

Metal ID, provider, symbol, licence/attribution, periods, currency/unit mapping, freshness threshold, fallback, enabled state.

### Insight/article

Title, slug, summary, body, author/reviewer, publish/update dates, category, related metal, sources, SEO fields, review state.

### Enquiry record

Intent, source page, UTM/campaign, contact/company, metal/specification, quantity/unit, origin/destination, terms/timing, consent version, attachment metadata, routing status, CRM ID, timestamps, spam/risk flags.

Editorial workflow: `Draft → Internal review → Compliance/data review → Scheduled → Published → Periodic review → Archived`.

---

## 13. Component inventory

### Shell

Announcement bar, header, desktop nav, mobile drawer, footer, breadcrumb, page shell, container, grid, section wrapper.

### Editorial

Hero, split hero, image block, proof/quote block, logo/category wall, metric strip, process timeline, network map.

### Market

Ticker, quote card, table, mobile market card, chart, range selector, freshness badge, disclaimer, unit/currency selector, data-table alternative.

### Trade/trust

Lifecycle, capability card, specification table, evidence item, trust stepper, Incoterm explainer, FAQ, route card.

### Forms/feedback

Intent selector, input/select/combobox, quantity+unit field, phone field, upload, stepper, review summary, validation, success, alert, modal/drawer, toast.

For each component specify responsive behaviour, keyboard behaviour, loading/empty/error/success states, content limits, analytics events, and approved content slots.

---

## 14. States, errors, and edge cases

### Market data

Live, delayed, stale, provider unavailable, partial, conversion unavailable, range unavailable, timezone mismatch, invalid value, market closed/no session.

### Forms

Required field missing, invalid email/phone, quantity-unit mismatch, unsupported/oversized file, malware scan pending/failed, duplicate submission, spam challenge, CRM unavailable, email failure, consent missing, success with routing pending.

### Global

Loading skeleton, offline/network failure, 404, maintenance, unsupported browser only when necessary.

Errors must say what happened, what to do, and whether the submission was received. Never expose stack traces, keys, internal IDs, or compliance decision logic.

---

## 15. Technical/API considerations

Recommended shape: server-rendered/static content for SEO and resilience; server-side market integration; CMS; API layer; secure upload storage; CRM/email handoff; consent-aware analytics; monitoring.

Suggested endpoints:

```text
GET  /api/markets
GET  /api/markets/:metal
GET  /api/markets/:metal/history?range=7d
POST /api/enquiries/supply
POST /api/enquiries/buying
POST /api/enquiries/logistics
POST /api/enquiries/general
POST /api/uploads/presign
GET  /api/health/market-data       (protected/internal)
```

Safeguards: rate limiting, bot protection, CSRF protection where applicable, server validation, idempotency keys, malware scanning, encryption, role-based access, consent-version audit, public/private data separation, and provider credential isolation.

Confirm CMS, CRM, transactional email, consent manager, market providers, storage, map/search, CDN/hosting, monitoring, and incident alerting.

---

## 16. Security and privacy

- HTTPS, secure headers, content security policy, dependency/secret scanning.
- Accessible bot protection; no sensitive data in URLs or analytics.
- Strict upload allowlist, scan, retention, and access controls.
- Privacy, cookie, terms, and accessibility pages.
- Separate essential operation from marketing consent.
- Define retention for enquiries/uploads and a data-request route.
- Never send document contents to analytics or email bodies.
- Role-based access and audit trail for internal records.

Jurisdiction-specific obligations require client counsel review; this is a product/UX framework, not legal advice.

---

## 17. Analytics and measurement

### Event dictionary

```text
page_view, market_quote_view, market_range_change, market_unit_change,
metal_detail_view, cta_supply_click, cta_buy_click, cta_logistics_click,
enquiry_start, enquiry_step_complete, enquiry_validation_error,
file_upload_started, file_upload_completed, enquiry_submit_success,
enquiry_submit_error, contact_method_click, trust_content_view, faq_open
```

Never send PII, document contents, or sensitive free text to analytics.

### Dashboards

Qualified enquiry rate by intent; completion/drop-off by step; response time; qualified-opportunity rate; top metals/forms; market-to-enquiry conversion; source/campaign quality; quote freshness/provider uptime; spam/error rate; device conversion; organic landing and assisted conversion.

Suggested internal statuses: `New → Contacted → Qualification pending → Qualified → Matched → Negotiation → Won / Lost / Disqualified`.

---

## 18. SEO and discoverability

Semantic HTML, server-rendered metadata, canonical URLs, Open Graph, sitemap, robots policy, structured data where accurate, responsive images, stable metal URLs, and no indexable thin/internal states.

Useful content themes: copper benchmarks and forms, gold market references, lithium carbonate/hydroxide sourcing, metal logistics, Incoterms, assay, inspection, provenance, and responsible sourcing. Every market page needs timestamp, provider/source context, and physical-metal content. Do not generate thin pages from unsupported combinations.

Store timestamps in UTC; render timezone clearly; keep unit/currency formatting locale-aware; plan language routes if required.

---

## 19. MVP and roadmap

### MVP

Home; Markets overview; metal detail template for initial metals; Trade & Logistics; Company; Contact/enquiry hub; legal pages; responsive design system; accessible forms; licensed or explicitly mocked market data; historical ranges where available; CRM/email handoff; CMS; analytics/consent; SEO; monitoring.

### Phase 2

More metals/forms; historical comparison; saved markets/alerts; insights; regional pages; qualification workflows; document requests; internal enquiry dashboard.

### Phase 3

Authenticated accounts; secure document exchange; enquiry/trade status; shipment milestones; approved counterparties; notifications; audit trail; role-based access; CRM/ERP/TMS integrations.

Do not add public offer boards, automated matching, algorithmic pricing, payment/settlement, or investment-style signals before validated need, legal review, and operational readiness.

---

## 20. Client discovery checklist

### Business

Legal entity, countries served/excluded, metals/forms, supplier and buyer categories, typical quantities, client role (broker/principal/agent/coordinator), response SLA, languages.

### Trust/compliance

KYC/KYB, sanctions/export controls, provenance policy, inspection partners, acceptable documents, certifications, approved metrics/logos, claims counsel approved, retention, attachment visibility, escalation.

### Markets

Provider/licence, realtime/delayed/EOD, units/currencies, display rights, update interval, history, attribution, disclaimer, fallback owner.

### Logistics

Modes, lanes, ports, warehouses, customs/insurance responsibility, Incoterms, tracking, documents, services not provided.

### Operations

Lead owner/backup, CRM, email domains, storage, escalation, response templates, reporting cadence.

---

## 21. Handoff for Codex and Claude Code

### Repository documentation

Maintain `README.md` with purpose, routes, setup, environment variables, data providers/licensing assumptions, CMS, integrations, tests, deployment, and content workflow. Maintain `AGENTS.md` / `CLAUDE.md` with product principles, visual tone, accessibility baseline, unsupported-claims rule, benchmark-vs-transaction rule, privacy constraints, component conventions, and definition of done.

### Build sequence

1. Confirm claims, metals, jurisdictions, operations, and data licensing.
2. Create content model and route inventory.
3. Establish design tokens and layout primitives.
4. Build shell, header, footer, and CTA routing.
5. Build Home with realistic content.
6. Build Markets and quote states.
7. Build metal detail and chart abstraction.
8. Build forms with server validation and mocked handoff.
9. Build logistics and Company.
10. Bind CMS and provider.
11. Add analytics, SEO, monitoring, and legal content.
12. Run visual, responsive, accessibility, security, and content QA.

### Definition of done per page

Approved hierarchy; mobile/tablet/desktop review; keyboard/screen-reader review; loading/empty/error/success states; SEO metadata; consent-aware analytics; rights-cleared optimised images; no unsupported claims/placeholders; verified links/forms; QA evidence.

### Coding-agent task contract

Every task should state route, user intent, acceptance criteria, content/schema, states, accessibility, analytics, data assumptions, allowed files/components, and verification steps.

```text
Build /markets/[metal] using the approved Metal and MarketQuote contracts.
Implement live, delayed, stale, unavailable, and no-history states.
Support keyboard range controls and a data-table alternative.
Label the value as an informational benchmark with provider and UTC timestamp.
Add conversion events without sending PII.
Use existing tokens/components; do not invent colours.
Verify at 375px, 768px, 1280px, and keyboard-only navigation.
```

Maintain: blueprint, sitemap, content schema, design tokens, component inventory, API contracts, analytics dictionary, claim register, review log, decision log, and QA checklist.

---

## 22. Launch readiness checklist

- [ ] Positioning, audience labels, metal list, forms, claims, response SLA, and routing owner approved.
- [ ] Market provider licence, attribution, freshness, history, fallback, units, and currencies verified.
- [ ] Forms, CRM/email delivery, duplicate/spam handling, uploads, consent, and confirmation messages tested.
- [ ] Mobile/desktop, keyboard, screen-reader, reduced-motion, focus, contrast, error, and empty states tested.
- [ ] Secrets excluded from client bundle; headers, monitoring, backup/recovery, and incident owner confirmed.
- [ ] Privacy, terms, cookies, and accessibility pages live.
- [ ] Metadata, canonical URLs, sitemap, structured data, analytics, and no-PII tracking validated.

## 23. North star

> **A premium institutional bridge between physical metal supply and serious demand—where market context, material evidence, human judgement, and logistics execution come together.**

The supplier should think, “These people have access to real buyers.” The buyer should think, “These people understand the material, market, and route to delivery.” The client should think, “This website qualifies better opportunities and gives our team the information needed to act.”
