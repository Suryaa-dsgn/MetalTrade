# Physical Metals Trading Portal
## Design System & Visual Direction Specification

**Status:** Implementation-ready design direction  
**Audience:** Product designers, frontend engineers, Codex, Claude Code, and future CMS/content contributors  
**Product type:** Light-mode physical metals trading, sourcing, logistics, and market-intelligence website  
**Primary users:** Qualified metal suppliers, industrial buyers, trade partners, and internal commercial teams

---

## 1. Executive direction

This product should feel like a **credible industrial trading house with a modern market-intelligence layer**.

It is not a generic SaaS dashboard, a crypto exchange, an investor-relations site, or a consumer marketplace. The interface must communicate:

- physical materials and real-world movement;
- verified supply and qualified demand;
- current market awareness without pretending to be a broker terminal;
- calm, evidence-based professionalism;
- global logistics and operational competence;
- premium editorial quality without decorative excess.

The visual system has two connected modes:

### Editorial mode

Used for Home, Company, Trade & Logistics, Responsible Sourcing, and major storytelling sections.

- Large industrial photography.
- Strong, occasionally oversized typography.
- Asymmetric compositions.
- Dark mineral panels used as deliberate chapters.
- Thin rules, captions, labels, and operational proof points.
- More visual breathing room and lower information density.

### Market mode

Used for Markets, metal detail pages, price history, tables, and market summaries.

- Warm-white or white surfaces.
- Precise numeric hierarchy.
- Stable grids and aligned columns.
- Restrained chart colors.
- Compact controls and filter bars.
- Minimal imagery; content and data lead.

The two modes share typography, spacing, borders, radius, status colors, and interaction behavior. They should never feel like two unrelated products.

---

## 2. Screenshot-derived visual language

The six supplied references establish a consistent visual vocabulary. Use the following observations as design constraints, not as templates to copy literally.

### 2.1 Composition patterns

- Full-bleed or near-full-bleed hero areas with text anchored to a strong edge.
- Large visual subject on one side and a clear information block on the other.
- Browser/dashboard mockups or floating panels used to show product capability.
- Editorial sections that alternate between text-led and image-led layouts.
- Large dark blocks followed by bright, quiet content sections.
- Split layouts with a primary content field and a secondary side panel.
- Small labels, metadata, and micro-navigation used to make the interface feel considered.
- Clear hierarchy created by scale and alignment rather than by many colors.

### 2.2 Surface patterns

- Light canvas with near-white cards rather than a gray application shell.
- Dark graphite, ink-blue, or deep navy sections used as visual anchors.
- Cards with modest rounding, not inflated “pill everywhere” styling.
- Thin borders and subtle elevation.
- Side panels that feel like part of the same surface, not unrelated popovers.
- Large image surfaces with controlled cropping and restrained overlays.

### 2.3 Type patterns

- Rounded grotesk / humanist sans-serif.
- Large, clean headlines with tight but comfortable line-height.
- Short uppercase eyebrow labels with tracking.
- Strong numeric emphasis for balances, prices, percentages, and operating facts.
- Body copy kept narrow enough to remain readable.
- Bold text reserved for hierarchy, not used across every label.

### 2.4 Interaction patterns

- Segmented time ranges and compact filter controls.
- Clear primary action plus quieter secondary action.
- Tables with lots of alignment discipline and minimal decoration.
- Contextual side panels for detail, filters, or monthly summaries.
- Charts with visible selected points, a single focused tooltip, and clear time context.
- Small status badges and inline trend indicators.

### 2.5 What to take from the references

Take the **composition, hierarchy, restraint, and information architecture**. Do not copy:

- crypto-specific neon colors;
- generic blue/purple fintech gradients;
- excessive glassmorphism;
- decorative 3D illustrations unrelated to metals;
- invented dashboard metrics;
- dense terminal-style screens for the public website.

---

## 3. Brand personality

### Core archetype

**Institutional × Industrial × Global × Responsible**

### Supporting traits

- Precise, not cold.
- Premium, not luxurious.
- Modern, not futuristic.
- Confident, not loud.
- Transparent, not promotional.
- Human, not casual.
- Technical, but explainable.

### Design sentence

> Make every screen feel like a well-run physical trade: clear material, known counterparties, visible evidence, controlled movement, and no unnecessary noise.

### Trust principle

Trust must come from evidence and process, not unsupported adjectives. Prefer:

`Grade · Purity · Origin · Assay · Inspection · Documentation · Incoterm · Delivery`

over:

`Trusted · Secure · Best-in-class · Authentic · Reliable`

Unless a claim is substantiated by the client, present it as a planned capability or an available documentation field, not as a factual promise.

---

## 4. Color system

### 4.1 Recommended direction: Industrial Cobalt + Signal Orange

The recommended primary is **Industrial Cobalt**, a confident, saturated blue that feels precise, modern, and energetic without drifting into purple. It gives the site stronger visual presence than a muted teal while remaining appropriate for global trade and market intelligence.

Use **Signal Orange** as a restrained material and action accent. It can suggest heat, movement, ports, fabrication, and physical material, but it must not become a second dominant brand color.

### 4.2 Color principles

- Light mode is the default and must remain the default.
- Never use purple, violet, lavender, indigo, or purple-adjacent gradients.
- Do not use rainbow or neon chart palettes.
- Use color to communicate hierarchy, state, and action.
- Keep most of the page neutral; brand color should be earned.
- Dark sections may use graphite/mineral backgrounds, but they are editorial chapters—not a separate dark theme.
- Avoid gradients as backgrounds. A subtle photographic tonal shift is acceptable; a CSS gradient is not the default solution.

### 4.3 Exact token proposal

These values are the starting system. Adjust only with a documented reason and contrast check.

```css
:root {
  /* Core surfaces */
  --background: 42 24% 97%;          /* warm paper */
  --foreground: 210 22% 14%;         /* graphite ink */
  --surface: 0 0% 100%;              /* white card */
  --surface-muted: 42 18% 94%;       /* quiet panel */
  --surface-subtle: 42 15% 91%;      /* table hover / input fill */

  /* Brand */
  --primary: 221 72% 49%;            /* #2457D6 industrial cobalt */
  --primary-foreground: 0 0% 100%;
  --primary-hover: 224 71% 40%;      /* #1E40AF */
  --primary-soft: 220 86% 94%;       /* pale cobalt wash */

  /* Material / movement accent */
  --orange: 20 75% 53%;              /* #E26D2D signal orange */
  --orange-soft: 20 75% 93%;

  /* Editorial darks */
  --mineral: 210 28% 16%;             /* #1D2A35 */
  --mineral-2: 204 25% 22%;           /* #2A3C49 */
  --mineral-foreground: 42 24% 97%;

  /* Borders / muted text */
  --border: 210 14% 84%;
  --border-strong: 210 14% 70%;
  --input: 210 14% 78%;
  --muted: 210 12% 46%;
  --muted-foreground: 210 12% 40%;

  /* Semantic */
  --positive: 151 55% 30%;           /* #23784E */
  --positive-soft: 148 43% 91%;
  --negative: 4 64% 43%;              /* #B33E31 */
  --negative-soft: 5 52% 92%;
  --warning: 38 82% 36%;             /* #A86D10 */
  --warning-soft: 39 73% 91%;
  --info: 199 68% 34%;               /* #1B6D92 */
  --info-soft: 199 50% 91%;

  /* Focus */
  --ring: 174 67% 28%;
}
```

### 4.4 Color use by context

| Context | Preferred treatment |
|---|---|
| Primary CTA | Industrial Cobalt fill, white text |
| Secondary CTA | Transparent or white fill, graphite text, visible border |
| Material highlight | Signal Orange rule, icon, marker, or small badge |
| Positive price movement | Positive green plus upward arrow |
| Negative price movement | Negative red plus downward arrow |
| Neutral price movement | Muted graphite with horizontal arrow or em dash |
| Editorial section | Ink blue or deep navy background with warm white text |
| Disabled state | Muted surface and muted text; never rely on opacity alone |
| Focus state | 2px ring using `--ring`, with sufficient offset |

### 4.5 Anti-patterns

Do not use:

- purple buttons;
- purple charts;
- blue-purple hero gradients;
- neon green as a general accent;
- red/green alone to communicate meaning;
- low-contrast gray text below readable contrast;
- five unrelated accent colors on one screen.

---

## 5. Typography

### 5.1 Font direction

Use a rounded, highly legible sans-serif close to **Geist Sans, SF Pro Display, or an approved equivalent**.

Recommended stack:

```css
font-family: "Geist", "SF Pro Display", "SF Pro Text", Inter, ui-sans-serif, system-ui, sans-serif;
```

If Geist is unavailable, use a neutral system fallback. Do not substitute a geometric display font that makes body copy look futuristic or playful.

### 5.2 Type tokens

```css
:root {
  --font-sans: "Geist", "SF Pro Display", "SF Pro Text", Inter, ui-sans-serif, system-ui, sans-serif;
  --tracking-tight: -0.035em;
  --tracking-normal: -0.01em;
  --tracking-label: 0.12em;
}
```

| Token | Size | Line height | Weight | Use |
|---|---:|---:|---:|---|
| Display XL | 64px | 0.98 | 500–600 | Hero only, large desktop |
| Display L | 52px | 1.02 | 500–600 | Major editorial heading |
| H1 | 44px | 1.05 | 600 | Page title |
| H2 | 36px | 1.10 | 600 | Section title |
| H3 | 26px | 1.18 | 600 | Card/group heading |
| H4 | 20px | 1.25 | 600 | Component heading |
| Body L | 18px | 1.55 | 400 | Intro/supporting copy |
| Body | 16px | 1.55 | 400 | Default reading copy |
| Body S | 14px | 1.45 | 400–500 | Supporting copy/table cells |
| Label | 11px | 1.2 | 600 | Uppercase metadata |
| Price XL | 44px | 1.0 | 600 | Key market price |
| Price L | 30px | 1.05 | 600 | Card price |
| Numeric | tabular | 1.2 | 500–600 | Tables, metrics |

### 5.3 Typography rules

- Use `font-variant-numeric: tabular-nums` for prices, quantities, dates, and percentages.
- Use sentence case for navigation and body content.
- Use uppercase only for short labels, categories, timestamps, and codes.
- Avoid all-caps paragraphs.
- Keep editorial copy to approximately 45–70 characters per line.
- Do not use more than three font weights on one page.
- Headlines may be tight; body text must remain open and readable.
- Avoid oversized headlines that push the core value proposition below the fold.

---

## 6. Layout, grid, and spacing

### 6.1 Container rules

```css
--container-max: 1440px;
--container-reading: 720px;
--gutter-desktop: 64px;
--gutter-tablet: 40px;
--gutter-mobile: 20px;
```

- Maximum content width: 1440px.
- Standard desktop gutter: 64px.
- Large editorial sections may use a 12-column grid with intentional edge alignment.
- Market pages use a stable 12-column grid and consistent table rails.
- Keep text blocks narrower than image blocks.
- Use full-bleed imagery only when the crop and focal point are known.

### 6.2 Spacing scale

Use a 4px base unit and favor multiples of 8px for major structure.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

### 6.3 Rhythm rules

- 8–12px: label to value, icon to text, compact control internals.
- 16–24px: card internals and related control groups.
- 32–48px: section internals and content clusters.
- 64–96px: section separation on market pages.
- 96–160px: editorial chapter separation when the image is doing narrative work.
- Never add whitespace randomly to make a screen “feel premium.” Every gap should support hierarchy.

### 6.4 Responsive breakpoints

```ts
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1440px
```

Design mobile first. At narrower widths:

- collapse multi-column editorial layouts into a deliberate reading sequence;
- turn side panels into drawers or stacked sections;
- allow tables to scroll horizontally rather than destroying column meaning;
- keep primary actions visible without requiring a hover;
- reduce display type gradually, not abruptly;
- preserve 20px minimum side gutters;
- never crop the material subject out of a hero image just to preserve a desktop composition.

---

## 7. Radius, borders, shadows, and elevation

### 7.1 Radius

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-pill: 999px;
```

Use:

- `sm` for inputs, badges, and compact controls;
- `md` for standard cards and buttons;
- `lg` for editorial image cards and larger panels;
- `xl` only for hero mockups or intentionally soft containers;
- pill radius only for tags, status badges, and segmented controls.

Do not give every card a 24px radius. The product should feel engineered, not inflated.

### 7.2 Borders

```css
--border-subtle: 1px solid hsl(var(--border) / 0.72);
--border-default: 1px solid hsl(var(--border));
--border-strong: 1px solid hsl(var(--border-strong));
```

Use borders to create alignment and rhythm. Prefer borders over shadows in data interfaces.

### 7.3 Shadows

```css
--shadow-sm: 0 1px 2px hsl(210 22% 14% / 0.06);
--shadow-md: 0 8px 24px hsl(210 22% 14% / 0.08);
--shadow-lg: 0 20px 48px hsl(210 22% 14% / 0.12);
```

Use shadows only for:

- floating menus;
- dialogs;
- elevated hero mockups;
- sticky action panels;
- draggable or selected surfaces.

Avoid shadows on every card in a table or grid.

---

## 8. Navigation and page chrome

### 8.1 Public navigation

Recommended information architecture:

```text
Logo
Markets
Metals
Trade & Logistics
Company
Contact

Primary action: Discuss a Requirement
```

Navigation should be:

- quiet and highly legible;
- one horizontal row on desktop;
- sticky only when it improves orientation;
- separated from the hero by spacing or a very light rule;
- able to switch to a compact menu on mobile.

Do not make the public header look like a crypto trading terminal.

### 8.2 Market navigation

Markets pages may use a secondary navigation or tab rail for:

`Overview · Metals · Price History · Trade Context`

The active tab uses Industrial Cobalt text and a 2px underline or a quiet filled state. Do not use a purple active pill.

### 8.3 Breadcrumbs

Use breadcrumbs on:

- metal detail pages;
- responsible sourcing pages;
- resource/document pages;
- deep logistics flows.

Keep them short. They are orientation, not a second navigation menu.

---

## 9. Hero composition

### 9.1 Public hero

The hero should answer, in order:

1. What does the company do?
2. Who is it for?
3. What should I do next?

Recommended composition:

```text
[eyebrow: PHYSICAL METALS / GLOBAL TRADE]

Connecting global metal supply
with qualified demand.

Short evidence-based supporting copy.

[I Have Metal to Sell] [I Want to Source Metal]

                           [industrial image / material image]
```

Optional supporting layer:

- a compact market snapshot;
- a source → intermediary → buyer diagram;
- three real operating facts;
- an availability/status line.

### 9.2 Hero rules

- Use one dominant message, not three competing headlines.
- Keep the first screen visually strong but operationally clear.
- Use the image as a physical-world anchor.
- If using a dark hero, use a solid mineral background or a real photograph with a controlled dark overlay—not a gradient mesh.
- Place the primary CTA where it is visible without scrolling.
- Do not put a dense table in the hero.

### 9.3 Market hero

Market pages should start with a compact information header:

```text
Markets
Live reference prices and historical movement

[Search metals] [Currency] [Unit] [Last updated]
```

The first screen should prioritize search, update freshness, and the primary market table—not a decorative image.

---

## 10. Editorial imagery system

### 10.1 Image categories

Organize image assets into six categories:

1. **Source:** mines, extraction, deposits, processing plants.
2. **Material:** cathodes, bullion, ingots, concentrates, refined metal, macro textures.
3. **Verification:** laboratories, sampling, assay, inspection, measurement.
4. **Logistics:** ports, ships, freight, containers, warehouses, rail.
5. **Destination:** manufacturing, energy, infrastructure, batteries, industrial plants.
6. **Global trade:** maps, trade corridors, industrial cities, shipping lanes.

### 10.2 Photography direction

Prefer:

- real industrial scale;
- natural or directional light;
- visible texture: steel, earth, ore, metal, concrete, water;
- strong geometry and useful negative space;
- close-up material detail for cards and detail pages;
- wide operational scenes for editorial chapters;
- a controlled, slightly cool-neutral grade with occasional warm metal tones.

Avoid:

- generic business handshakes;
- smiling office teams as the primary proof of capability;
- overly polished 3D renders unless the product is impossible to photograph;
- repeated sunset mine silhouettes;
- tiny images trapped inside rounded cards;
- fake labels, fake certifications, or unreadable document text.

### 10.3 Image treatment

- Use `object-fit: cover` for narrative surfaces.
- Define focal position per image; do not rely on the browser default.
- Use a subtle dark overlay only when text needs it.
- Keep editorial image overlays minimal.
- For material close-ups, allow the texture to fill the surface and let the UI remain quiet.
- Use captions and source/license metadata when appropriate.

### 10.4 Licensing rule

Commercial stock references must be licensed before production use. Do not hotlink stock sites or ship screenshot previews as final assets. Replace all placeholder references with client-provided licensed files.

### 10.5 `/public` asset convention

```text
/public/
  images/
    editorial/
      source-mine-headgear.webp
      logistics-port-hong-kong.webp
      verification-assay-lab.webp
    metals/
      copper-cathode-macro.webp
      gold-bullion-closeup.webp
      lithium-carbonate-detail.webp
    destination/
      battery-manufacturing-line.webp
  icons/
  documents/
  logos/
```

Naming rules:

- lowercase kebab-case;
- descriptive subject before variant;
- no spaces, dates, or random hashes in human-maintained assets;
- use `.webp` for web imagery unless transparency or source constraints require another format;
- provide a meaningful `alt` string in the content model;
- include `credit`, `license`, and `sourceUrl` fields for externally sourced imagery.

Recommended asset record:

```ts
type ImageAsset = {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  license?: string;
  sourceUrl?: string;
  focalPoint?: { x: number; y: number };
};
```

---

## 11. Component foundation: shadcn/ui

Use shadcn/ui as the primary component foundation. Keep the primitives accessible and composable, then apply the product tokens above.

### 11.1 Required shadcn primitives

- Button
- Badge
- Card
- Input
- Textarea
- Label
- Select
- Combobox
- Tabs
- Table
- Tooltip
- Popover
- Dropdown Menu
- Sheet
- Dialog
- Drawer
- Accordion
- Separator
- Skeleton
- Alert
- Breadcrumb
- Pagination
- Scroll Area
- Command
- Checkbox
- Radio Group
- Switch
- Calendar / Date Picker when needed

### 11.2 Component styling defaults

```tsx
// Tailwind direction, conceptual example
<Button className="rounded-md bg-primary text-primary-foreground hover:bg-primary-hover">
  Discuss a requirement
</Button>
```

Rules:

- Use semantic token classes, not hard-coded hex values in components.
- Extend variants with `cva` rather than duplicating utility strings.
- Keep focus-visible behavior intact.
- Do not remove keyboard interaction supplied by shadcn.
- Do not replace accessible controls with clickable `<div>` elements.
- Use `data-state` styles for tabs, accordions, menus, and selected rows.

### 11.3 Button hierarchy

| Variant | Use |
|---|---|
| Primary | One decisive action per region |
| Secondary | Important alternative action |
| Outline | Lower-emphasis action on light surface |
| Ghost | Navigation or utility action |
| Destructive | Irreversible or high-risk action only |
| Link | Inline navigation where a button would be too heavy |

Primary action labels should be specific:

- `Submit supply details`
- `Request a buying conversation`
- `View copper market`
- `Discuss logistics`

Avoid vague labels such as `Learn more` when the destination is known.

---

## 12. Core component specifications

### 12.1 Market ticker strip

Purpose: communicate active market awareness without dominating the page.

Structure:

```text
[Metal] [price] [change] [direction icon] [updated]
```

Rules:

- horizontal scroll on mobile;
- no auto-scrolling marquee unless specifically requested;
- visible update timestamp;
- use positive/negative color plus text/icon, never color alone;
- allow click-through to metal detail;
- include an accessible label such as “Copper, 8,420 US dollars per metric ton, up 1.2 percent.”

### 12.2 Metal card

Recommended structure:

```text
[image or material texture]
COPPER
Cathodes · Concentrates · Scrap

$8,420 / MT       +1.21%

[View market] [Discuss supply]
```

Rules:

- image occupies a meaningful area, not a tiny thumbnail;
- price and movement align on one row where possible;
- show only verified forms of trade;
- do not invent availability, purity, or volume.

### 12.3 Proof-point stat

Used for real operating facts:

```text
18
Trading markets
```

Rules:

- never use invented numbers in production;
- show source or date when context matters;
- keep label and value visually connected;
- use tabular numerals.

### 12.4 Trust framework stepper

Suggested steps:

```text
01 Know the counterparty
02 Know the material
03 Know the origin
04 Verify the material
05 Structure the trade
06 Control the movement
07 Confirm delivery
```

Use a horizontal sequence on desktop and a vertical sequence on mobile. Each step may expand to show actual process details, required documents, or a link to a policy page.

### 12.5 Side panel

Use for:

- market summary;
- filter controls;
- selected metal details;
- enquiry context;
- logistics milestone detail.

Desktop: fixed-width right rail between 320px and 400px.  
Mobile: `Sheet` or `Drawer`, with a visible title and close button.

### 12.6 Enquiry form

Use intent-specific forms rather than one generic form.

Supplier path:

```text
Material · Form · Estimated quantity · Origin · Availability · Contact
```

Buyer path:

```text
Material · Required form · Quantity · Destination · Timing · Contact
```

Rules:

- explain why each sensitive field is requested;
- show progress for multi-step forms;
- preserve entered data after validation errors;
- provide a confirmation state with expected response time;
- never expose a fake “instant trade” flow if the business is relationship-led.

---

## 13. Charts and market interaction

### 13.1 Chart visual language

- Use a single primary series in Industrial Cobalt or graphite.
- Use a second series only when comparison is meaningful.
- Use Signal Orange for a selected benchmark or material-specific highlight, not every line.
- Gridlines are 1px and low contrast.
- Axes and labels are muted but readable.
- Use a 4–6px line, depending on chart size.
- Use a subtle area fill only when it improves readability; no gradient fill.
- Do not use 3D charts, donut charts for simple two-value comparisons, or decorative sparkline overload.

### 13.2 Time controls

Default ranges:

`1D · 7D · 1M · 3M · 1Y · 5Y`

If the data source does not support a range, disable it with a short explanation. Do not show a working-looking control that returns fake data.

### 13.3 Tooltip rules

- One tooltip at a time.
- Show exact date/time, value, unit, and series name.
- Keep tooltip within the viewport.
- Provide a text alternative or data table for screen-reader and keyboard users.
- Use the same number formatting as the surrounding page.

### 13.4 Chart loading/error states

Loading:

- preserve chart dimensions;
- show a neutral skeleton grid or inline loading label;
- avoid animated fake lines.

Error:

- retain title and selected range;
- state that market data could not be loaded;
- show last known timestamp if available;
- offer retry;
- never replace the chart with invented sample values.

Stale data:

- show `Last updated` prominently;
- distinguish live, delayed, and historical data;
- use a neutral stale indicator rather than alarming red unless there is a real issue.

### 13.5 Number formatting

- Always show unit and currency.
- Use consistent decimal precision within a table or chart.
- Use locale-aware formatting, but preserve a clear canonical format in data exports.
- Show `—` for unavailable values, not `0`.
- Preserve a minus sign for negative movement.

---

## 14. Tables and data density

### 14.1 Market table anatomy

Recommended columns:

```text
Metal | Reference price | 24h | 7d | Unit | Market status | Updated
```

Rules:

- left-align names and categorical content;
- right-align numeric values;
- use tabular numerals;
- keep column headers visible on long tables;
- use row hover and focus states, not heavy row cards;
- make the full row or a clear action interactive;
- show sorting direction and accessible sort labels;
- support keyboard navigation where rows are selectable.

### 14.2 Responsive table behavior

At mobile widths:

- keep the primary identity and price columns visible;
- allow horizontal scrolling for secondary columns;
- optionally provide a compact card view only when it preserves all important meaning;
- never hide price, unit, status, or updated time without a clear alternative.

### 14.3 Empty tables

Use a calm, specific message:

> No market data is available for this selection yet.

Include:

- what the user selected;
- whether the issue is temporary or expected;
- a retry or alternative action where appropriate.

---

## 15. Editorial sections and storytelling modules

### 15.1 Source → material → logistics → buyer

Use a visual flow to explain the business model. It should be legible without animation:

```text
SOURCE
Verified material
      ↓
TRADE DESK
Qualification · pricing · documentation
      ↓
LOGISTICS
Inspection · freight · customs · delivery
      ↓
BUYER
Qualified demand and destination
```

The flow can be horizontal on desktop and vertical on mobile. Use rules and numbered stages before using arrows with heavy decoration.

### 15.2 Responsible sourcing section

Use process language and careful claims. Suggested topics:

- supplier due diligence;
- origin documentation;
- counterparty screening;
- material verification;
- inspection and assay;
- transport and trade documents;
- delivery confirmation.

Do not claim ICMM, OECD, conflict-free, or other certification status unless documentation exists and has been approved for publication.

### 15.3 Editorial proof section

Combine:

- one strong image;
- one operational statement;
- two or three verified facts;
- one clear action.

Avoid turning every section into a marketing card grid.

---

## 16. Motion and interaction

Motion should communicate state, continuity, and spatial relationship. It must not make the site feel like a concept demo.

### Motion tokens

```css
--ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast: 120ms;
--duration-standard: 180ms;
--duration-slow: 320ms;
```

Use motion for:

- button and link feedback;
- drawer/dialog entry;
- chart selection and tooltip movement;
- accordion expansion;
- image reveal when it clarifies sequence;
- sticky navigation transitions.

Avoid:

- perpetual floating objects;
- scroll-jacking;
- large parallax on data pages;
- animated gradients;
- excessive text splitting;
- motion that hides the content until a long entrance animation finishes.

Respect `prefers-reduced-motion`. Reduce movement to opacity or instant state changes.

---

## 17. Empty, loading, error, and success states

Every data-backed component must define these states before implementation.

### Empty

- Explain what is missing.
- Tell the user what can be done next.
- Use a neutral illustration or icon only when it helps.
- Do not show a large generic “Nothing here” card.

### Loading

- Match the final layout footprint.
- Use skeletons for cards, tables, and panels.
- Use a small progress indicator for actions under a few seconds.
- Disable only the controls that cannot safely be used.

### Error

- State the problem in plain language.
- Preserve user input and selected filters.
- Offer retry.
- Provide a support/contact path for persistent issues.
- Never expose raw API errors to public users.

### Success

- Confirm the exact action.
- Tell the user what happens next.
- Include a reference ID when a form or enquiry was submitted.
- Do not use confetti or celebratory animation for serious trade workflows.

---

## 18. Accessibility and contrast

Target WCAG 2.2 AA as the baseline.

- Body text contrast: at least 4.5:1.
- Large text contrast: at least 3:1.
- UI controls and focus indicators: at least 3:1 against adjacent colors.
- Never use green/red alone for price movement or status.
- Provide text labels, arrows, or icons alongside color.
- All interactive elements need visible `:focus-visible` states.
- Maintain a logical heading hierarchy.
- Images need meaningful alt text or empty alt for purely decorative imagery.
- Charts need a textual summary or accessible data table.
- Dialogs and drawers must trap focus and restore focus on close.
- Tables need header associations and sortable-state announcements.
- Touch targets should be at least 44×44px where practical.
- Do not put essential text inside images.
- Ensure mobile zoom does not break the layout.

### Dark editorial sections

Warm-white text on Mineral backgrounds is acceptable only after contrast testing. Do not use muted gray text for essential content on dark surfaces.

---

## 19. Page-level visual recipes

### Home

1. Quiet global header.
2. Hero with industrial image and intent-specific CTAs.
3. Compact market ticker.
4. What we trade: editorial metal cards.
5. Source → trade desk → logistics → buyer explanation.
6. Supplier proof section.
7. Buyer proof section.
8. Responsible sourcing / trust framework.
9. Verified operational facts.
10. Final enquiry CTA.

### Markets

1. Page header and update status.
2. Search, unit, currency, and filter controls.
3. Market overview table.
4. Optional compact movers or watchlist panel.
5. Data source and delay note.

### Metal detail

1. Breadcrumb and metal identity.
2. Current reference price, change, unit, timestamp.
3. Interactive historical chart.
4. Summary metrics: open, previous close, ranges where available.
5. Forms traded and material image.
6. Specifications and documentation fields.
7. Applications / destination industries.
8. Supplier and buyer CTAs.

### Trade & Logistics

1. Editorial hero with port, freight, or industrial movement image.
2. Process timeline.
3. Inspection/documentation modules.
4. Logistics capabilities and boundaries.
5. Enquiry CTA.

### Company / Responsible sourcing

1. Evidence-led company proposition.
2. Network and operating model.
3. Trust framework.
4. Due diligence and documentation language.
5. Approved proof points.
6. Contact CTA.

---

## 20. Tailwind and shadcn implementation guidance

### Tailwind setup

Map the CSS variables into Tailwind semantic colors. Prefer classes such as:

```text
bg-background
text-foreground
bg-card
text-muted-foreground
border-border
bg-primary
text-primary-foreground
bg-destructive
```

Add named utilities for product-specific colors only when they are truly semantic:

```text
text-positive
bg-positive-soft
text-negative
bg-copper
bg-mineral
```

Do not scatter arbitrary values like `bg-[#176E63]` throughout the application.

### Component organization

```text
components/
  ui/                 # shadcn primitives
  brand/              # logo, wordmark, section labels
  editorial/          # hero, image sections, process story
  market/             # ticker, chart, market table, metric cards
  trade/              # enquiry forms, trust steps, logistics timeline
  layout/             # header, footer, container, responsive rails
lib/
  formatters.ts
  market-data.ts
  image-assets.ts
  accessibility.ts
```

### Data boundaries

Keep market data and content data separate from presentation. Components should receive structured props rather than embed invented values:

```ts
type MarketQuote = {
  symbol: string;
  name: string;
  price: number | null;
  currency: string;
  unit: string;
  change24h: number | null;
  updatedAt: string | null;
  status: "live" | "delayed" | "historical" | "unavailable";
};
```

---

## 21. Do / Don’t rules

### Do

- Use real physical-world imagery and material texture.
- Let layout and typography create premium quality.
- Show update time and data source context.
- Use Industrial Cobalt as the disciplined primary.
- Use Signal Orange as a sparse material and movement accent.
- Build from shadcn primitives.
- Make forms intent-specific for suppliers and buyers.
- Show evidence, documents, process, and operational facts.
- Keep market pages calm and data-led.
- Define all async states.
- Test mobile and keyboard behavior early.

### Don’t

- Use purple or purple-adjacent gradients.
- Turn every section into a rounded card grid.
- Make the public site look like a crypto exchange.
- Invent prices, quantities, customer logos, certifications, or statistics.
- Present the client as certified or compliant without approval.
- Use stock images without a license record.
- Hide important text inside image overlays.
- Use red/green without labels or icons.
- Make a chart that looks real when its data is a placeholder.
- Add motion merely because a library makes it easy.
- Break the design system with page-specific colors.

---

## 22. AI coding agent guardrails

These rules are mandatory context for Codex, Claude Code, or any code-generation agent working on this project.

### Visual guardrails

1. The default theme is light mode.
2. Purple, violet, lavender, indigo, and purple gradients are prohibited. Industrial Cobalt is allowed; it must remain visibly blue rather than violet.
3. Use the provided CSS variables; do not invent new colors casually.
4. Use Industrial Cobalt as the primary action color.
5. Use Signal Orange sparingly and only with a clear semantic reason.
6. Do not add gradients, glassmorphism, neon glow, or decorative mesh backgrounds unless the product owner explicitly approves a specific exception.
7. Do not make every card heavily rounded or heavily shadowed.
8. Use imagery from `/public` when available; do not substitute generic remote stock images.
9. Do not invent text, claims, numbers, certifications, prices, partners, or data.
10. If content is unknown, use an explicit placeholder or an empty state—not a realistic-looking fake.

### Engineering guardrails

11. Build on shadcn/ui and preserve its accessibility behavior.
12. Reuse components and variants before creating new one-off components.
13. Keep semantic tokens centralized.
14. Keep market data, CMS content, and UI presentation separate.
15. Every async component must define loading, empty, stale, error, and success behavior as applicable.
16. Every chart must define units, time range, update time, tooltip content, and a text/data-table alternative.
17. Every image must have alt text and, when externally sourced, license metadata.
18. Every form must preserve input through validation and expose a clear next step after submission.
19. Validate responsive behavior at 375px, 768px, 1024px, and 1440px widths.
20. Test keyboard navigation and `prefers-reduced-motion` before considering a component complete.

### Decision protocol for agents

When a requirement is ambiguous:

1. Prefer the established tokens and existing component patterns.
2. Prefer a simple, evidence-led layout over a decorative concept.
3. Prefer a real empty state over invented content.
4. Prefer a stable responsive stack over preserving a desktop composition.
5. Flag missing data or claims in a TODO rather than guessing.
6. Do not expand scope into dashboards, checkout, trading execution, or account systems unless explicitly requested.

### Completion checklist

Before presenting a page or component as complete, the agent must confirm:

- Does it look intentionally light-mode?
- Is there any purple or unnecessary gradient?
- Are the strongest actions obvious?
- Is the type hierarchy consistent with this document?
- Are numeric values aligned and formatted consistently?
- Are image sources and licensing represented correctly?
- Are loading, empty, error, and stale states handled?
- Does it work without hover?
- Does it work on mobile?
- Does it meet keyboard and contrast expectations?
- Does it feel like physical metals and global trade rather than generic AI-generated SaaS?

---

## 23. Final north star

The finished website should feel like this:

> A calm, high-trust gateway between physical metal supply and qualified global demand—grounded in real material, real movement, clear market context, and visible operating discipline.

When choosing between two visual solutions, choose the one that makes the material, the market, the process, or the next action clearer.
