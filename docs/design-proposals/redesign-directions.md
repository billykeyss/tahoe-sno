# TahoeSno — Visual Redesign Proposal

**Status:** Design proposal only. No application code, theme, or build files were modified. All artifacts live under `docs/design-proposals/`.

**Stack context:** React Router 7 + MUI v7. Each direction below notes whether it is achievable by **re-theming MUI** (palette / typography / `components` overrides) or whether it needs **custom components** beyond what MUI's primitives express cleanly.

---

## Step 1 & 2 — Diagnosis: the current "AI-generated" tells

The app currently ships *two* themes — an inline one in `app/app.tsx` (the one actually used) and a fuller one in `app/theme/index.ts` — and they share the same generic SaaS DNA. Concrete tells, with locations:

| # | Tell | Where it appears |
|---|------|------------------|
| 1 | **Blue → purple gradient `#2563eb → #7c3aed`** used as the universal "brand" device | `app/app.tsx` brand text (lines 271–273), hero `linear-gradient` background (374–375), background radial glows (218–220); `app/theme/index.ts` `palette.gradient.primary` (235). The featured-section header even runs blue→purple→orange (`ResortGrid.tsx` 288). |
| 2 | **Gradient-clipped text headings** (`WebkitBackgroundClip: 'text'` + transparent fill) | Brand wordmark and hero `<h1>` in `app/app.tsx` (274–276, 396–398). This "shiny gradient headline" is the single most recognizable LLM-default flourish. |
| 3 | **Glassmorphism navbar/footer** — `alpha(paper, 0.8)` + `backdropFilter: blur(24px)` + 1px divider, `position: sticky` | Header (`app/app.tsx` 230–232) and footer (519–521). |
| 4 | **Inter with heavy negative letter-spacing** and 800 weights | Both themes set `fontFamily: "Inter…"` and `h1` at `fontWeight: 800, letterSpacing: -0.02em` (`app/app.tsx` 33–39; `app/theme/index.ts` 24–47, with `-0.025em`). |
| 5 | **Pulsing dots & floating logo** | Logo `float` keyframe (`app/app.tsx` 256–262); "Updated every hour" `pulse` dot (442–446); featured-count `pulse` dot (`ResortGrid.tsx` 354–358); the "API" chip pulses a box-shadow ring (`ResortCard.tsx` 340–354). |
| 6 | **Tinted pill badges** — `alpha(color, 0.1)` fill + `alpha(color, 0.2)` 1px border + 600 weight, repeated everywhere | "Live Data", "British Columbia" chip, snow-quality chip, weather chip, "API" chip, region/featured counts. Same recipe in `app/app.tsx`, `ResortGrid.tsx`, `ResortCard.tsx`. |
| 7 | **Gradient accent bar across the top of every surface** (`&::before` 2–4px gradient line) | Card top stripe (`ResortCard.tsx` 236–249), metric tiles (452–460), API panel (166–176), featured header (281–289), region headers (416–427). |
| 8 | **Lift-on-hover with big soft shadow** — `translateY(-8px)` + `0 20px 40px rgba(0,0,0,…)` | Card hover (`ResortCard.tsx` 228–235); buttons/icon-buttons in `app/theme/index.ts` (347–355, 414–416). |
| 9 | **Generic centered hero**: centered `max-width: 800px` headline + muted subtitle + rounded "status capsule" with a live dot | `app/app.tsx` 380–459. |
| 10 | **Tailwind/Radix default palette** (`#2563eb`, `#7c3aed`, `#059669`, slate `#0f172a`/`#64748b`, bg `#fafbfc`/`#0a0a0a`) | Palettes in both theme files. These exact hexes are the fingerprint of a default token set. |
| 11 | **Emoji as data iconography** (☀️ ⛅ ☁️ ❄️ 🌧️ 🍁) | `ResortCard.tsx` 38–44, forecast cells; the 🍁 chip in `app/app.tsx` 479. |

The net effect: it reads as "a competent dashboard template," not "a Tahoe snow product." Nothing about it says *mountain*, *cold*, *altitude*, or *ski culture*.

---

## Step 3 — Three distinct redesign directions

### Direction A — "Alpine Instrument" (technical / weather-station)

**Concept & mood.** Treat the app as a **backcountry weather instrument** — the readout on an avalanche beacon or a SNOTEL station, not a marketing site. Calm, dark, dense, trustworthy. The visual language is engineering: hairline grids, monospace numerals, measurement ticks, station coordinates. Color is almost entirely neutral so that *the data is the only thing that's loud*. One warm signal color (trail-marker orange) plus a cold powder-blue reserved exclusively for snow numbers.

**Color palette**

*Dark (primary mode — this is a glance-and-go utility, dark is the default):*
- Background `#0E1116`, panel `#11161D`, inset well `#1A212B`
- Hairlines `#232C38` / dividers `#2D3947`
- Ink `#E9EEF4`, secondary `#9AA7B6`, tertiary/units `#5E6B7B`
- Signal orange `#E8542B` (chains, alerts, brand mark)
- Powder blue `#BFE3FF` → `#4FA3E3` (fresh-snow data only)
- Open/good `#57C77F`, advisory `#E5A93B`, danger `#E5484D`

*Light:*
- Background `#F4F6F8` (cool paper), panel `#FFFFFF`, well `#EDF1F4`
- Hairlines `#DCE2E8` / `#C5CDD6`
- Ink `#16202B`, secondary `#516071`, units `#8593A3`
- Same orange / powder-blue / status accents (orange darkens to `#CC4218` for AA contrast on white)

**Typography.** No Inter. **Space Grotesk** for display, headings, and all metric numerals (a geometric grotesque with real personality in its digits and `t`/`a`). **IBM Plex Mono** for labels, units, station codes, timestamps — the "instrument readout." **Archivo** for body/UI copy (humanist grotesque workhorse). Type scale is **modest and tabular**: headings top out around 54px, metrics 30–40px, labels are tiny (10–11px) uppercase mono with wide tracking. No 800 weights; 600 is the heaviest.

**Layout & density.** High density, deliberately. Resort grid is a 3-up grid of **station cards** that read top-to-bottom as a panel: a measurement-tick rule strip with coordinates → name + temp readout → one hero metric (24h fresh, the actual question) → a compact **data table** for base/summit/7-day (not four floating tiles) → a 7-day histogram with a baseline ruler → a 5-day forecast strip → a telemetry footer (lifts X/Y, trails X/Y, wind, update time). The hero is a left-aligned statement + a right-aligned **region readout panel** (24h max, resorts open, chain status, freezing line).

**Component treatment.** Tight `4px` corners (machined, not soft). Flat surfaces, **no drop shadows** — depth comes from 1px hairlines and a faint engineering-grid underlay. Iconography is **line-drawn / CSS glyphs**, not emoji (e.g. the mountain mark is a CSS clip-path peak). Status is shown as small caps mono + a single dot, never a tinted pill.

**Motion.** Restrained and functional. No floating, no pulsing decoration. Allowed: a 1-frame value cross-fade on data refresh, a hairline border brighten + 2px lift on card hover, a sweep on the histogram on first paint. Motion should feel like a needle settling, not a UI showing off.

**Why it avoids the AI look.** Kills every tell at once: no gradients anywhere, no gradient text, no glass blur, no pulsing dots, no tinted pills, no Inter, no emoji. The neutral-plus-one-signal palette and mono/grotesque pairing are the opposite of the default blue-purple SaaS template. It looks *purpose-built for cold-weather data*.

**MUI feasibility.** ~70% **re-theme**: palette, `typography` (swap fonts + scale), `shape.borderRadius: 4`, flat `shadows`, and `components` overrides for `MuiCard`/`MuiChip`/`MuiPaper`. The **histogram, tick-rule strip, data table rows, and telemetry footer are custom components** (plain `Box` compositions) — but those are app components, not MUI primitives, so no fight with the framework.

---

### Direction B — "Tahoe Print" (editorial / alpine-journal)

**Concept & mood.** A printed mountain journal or a high-end resort field guide. Warm paper, generous whitespace, big confident serif headlines, an ink-and-one-accent restraint. It feels *written and curated* rather than generated — like the snow report is an editorial brief, with a "lede" resort and supporting entries. Light-first; the page should feel like good stock under a desk lamp.

**Color palette**

*Light (primary):*
- Paper `#F6F2EA` (warm off-white), card `#FFFDF8`, rule `#E4DCCC`
- Ink `#1C1A17` (near-black warm), secondary `#5B5346`, faint `#938A78`
- Accent: **alpenglow red** `#C2401E` (a single editorial ink, used for the lede, drop caps, and key numbers)
- Cold accent for snow figures: glacier `#2E6E8E`
- Subtle field tints: sage `#6E7B5E`, ochre `#B98A2E` for category tags

*Dark ("night edition"):*
- Background `#181613`, card `#211E19`, rule `#332E26`
- Ink `#EFE9DD`, secondary `#A89E8C`
- Alpenglow `#E0613C`, glacier `#6FB6D6`

**Typography.** A **humanist serif display** — **Fraunces** (optical sizing + "wonky" axis dialed up at large sizes) for headlines, with a **condensed companion** feel for kickers. Body in **Newsreader** or **Source Serif 4** for readable longform-style copy. **A small mono accent** (Spline Sans Mono) only for raw figures/units. The scale is **editorial and high-contrast**: oversized headline (clamp up to ~72px), a clear kicker/byline tier, comfortable 17–18px body measure. Real typographic detail: drop cap on the lede card, old-style figures, hanging punctuation feel.

**Layout & density.** Lower density, editorial rhythm. A **lede block** — the snowiest resort of the day gets a wide, magazine-style feature with a large number and a one-line "report." Remaining resorts become a 2–3 column **index** of quieter entries (name, region kicker, fresh-snow figure as a big serif numeral, a thin sparkline). Strong baseline grid; columns separated by **vertical hairline rules** like a newspaper. Section dividers are labeled rules ("NORTH SHORE — 8 areas").

**Component treatment.** Square or `2px` corners. **No shadows at all** — separation is whitespace + hairline rules + paper tint. Borders are thin warm rules. Iconography is minimal and **drawn line-art** (a single weather glyph set), or omitted in favor of words. Numbers are typeset, not boxed. Texture: a barely-there paper grain.

**Motion.** Almost none — print doesn't animate. Allowed: a gentle fade/translate-up as entries enter the viewport (like turning a page), and an underline-draw on links. Nothing loops.

**Why it avoids the AI look.** Serif-led, paper-toned, asymmetric editorial layout is categorically outside the LLM-default zone. There's no gradient, no glass, no pill, no centered SaaS hero. The "lede + index" structure is an *editorial* idea, not a dashboard template.

**MUI feasibility.** ~45% re-theme. Palette and typography re-theme cleanly, and `MuiDivider`/`MuiPaper` carry the rule-and-paper aesthetic. But the **asymmetric lede/index layout, drop caps, sparklines, and column rules are custom components and CSS** — MUI's `Card`/`Grid` are a starting scaffold only. This is the most custom of the three.

---

### Direction C — "Powder Day" (retro vintage-ski-poster)

**Concept & mood.** 1960s–70s **WPA / vintage ski-resort travel poster** energy — Squaw Valley '60 Olympics, screen-printed national-park posters. Bold flat color blocks, a limited "screen-print" ink palette, chunky geometric display type, sunburst and mountain motifs, a touch of grain. Optimistic, characterful, unmistakably *ski culture*. Works as a stylish but still legible dashboard.

**Color palette** (limited, like spot inks)

*Light (primary):*
- Sky cream `#F2E9D8`, card `#FBF5E8`
- Inks: deep pine `#1F4438`, vintage teal `#2C7A7B`, burnt orange `#D2691E`, faded denim `#3E6B8C`, brick `#A8432A`
- Snow `#F7FBFF` blocks, ink-black outline `#211C16`

*Dark ("dusk print"):*
- Background `#16201E` (dark pine), card `#1E2A27`
- Inks brighten: teal `#3FB6B0`, marigold `#E8A33A`, coral `#E07050`, snow `#EAF4F8`

**Typography.** A **chunky geometric display face** — **Bricolage Grotesque** (or a condensed display like **Anton** for poster titles) for big headers; a warm geometric **Poppins/DM Sans**-adjacent body — but to stay distinctive, pair the display with **Familjen Grotesk** for UI text. Numerals are big and friendly. The scale is **poster-bold**: huge condensed titles, generous tracking on small caps labels, no thin weights.

**Layout & density.** Medium density, **poster-card** grid. Each resort card is a mini travel poster: a flat-color "scene" header band (layered mountain silhouettes + a sunburst or arcing banner with the resort name in display type), then the data laid out as clean flat blocks with bold numerals. A repeating **banner ribbon** ("FRESH 31 CM") echoes poster typography. The page header is a wide hero poster ("LAKE TAHOE — SNOW REPORT") with layered ranges.

**Component treatment.** Flat color fills, **bold 1.5–2px ink outlines** instead of shadows, slightly rounded `6px` corners on blocks. Custom **layered SVG mountain/sunburst illustrations** carry the brand. A light **halftone/print grain** overlay sells the screen-print era. Iconography is a small bespoke flat icon set (sun, flake, wind arrows) — drawn, never emoji.

**Motion.** Expressive but tasteful. Allowed: a slow sunburst rotation behind the hero, a banner ribbon that "prints" in on load, snow figures that count up once. Keep it to the decorative scene layers; data stays still and readable.

**Why it avoids the AI look.** It commits to a real historical aesthetic with illustration and a spot-ink palette — the antithesis of a generic gradient template. No blue→purple, no glass, no Inter, no pulsing dot. The poster motif is a strong human point of view.

**MUI feasibility.** ~40% re-theme. Palette/typography/`shape` re-theme fine, but the **illustrated scene headers, sunburst, banner ribbons, halftone overlay, and bespoke icons are all custom SVG/CSS components.** It's the most art-direction-heavy and the slowest to maintain (illustrations per state).

---

## Step 4 — Recommendation: **Direction A, "Alpine Instrument"**

**Recommendation: Alpine Instrument.**

TahoeSno is a **utility people open for ten seconds before driving to the hill**: *Did it snow? How much? Is it open? What's the wind?* The job is fast, scannable, trustworthy data — and that is exactly what the instrument direction optimizes for.

Why it wins over the others for *this* product:
- **Legibility under haste.** Monospace numerals + a strict information hierarchy (one hero metric, then a compact table) let a user answer "how much fresh?" in a single glance. The editorial direction is beautiful but asks the reader to *read*; the poster direction asks them to *enjoy* — both add friction to a glance-and-go check.
- **Dark-first fits the use case.** People check conditions at 6am in the dark or in a car. A calm dark instrument panel is more comfortable and on-theme (cold, alpine) than bright paper or a bright poster.
- **Density scales.** The data model is rich (base/summit depth, 24h + 7-day, 5-day forecast, wind, and lifts/trails from `resortAPIs.ts`) and there are 40+ resorts. A dense, tabular card scales to a long list; magazine ledes and illustrated posters do not.
- **Cheapest to ship well in MUI v7.** It's ~70% a re-theme (palette, fonts, radius, flat shadows, component overrides), with only a handful of custom `Box`-composed sub-widgets. Directions B and C demand significant custom layout/illustration work.
- **It still has a strong point of view.** "Backcountry instrument" is a real, ownable identity for a snow product — it just expresses personality through restraint, precision, and one signal color rather than through decoration.

Keep B and C in the back pocket: borrow B's editorial "lede resort of the day" as an optional feature, and C's illustrated hero for a marketing/landing page.

---

## Step 5 — Mockup

A self-contained static reference for the recommended direction (hero/header + 3 resort cards with realistic Tahoe data — Palisades Tahoe, Heavenly, Northstar) is at:

`docs/design-proposals/mockup-recommended.html`

Open it directly in a browser (no build step; Google Fonts loaded via `<link>`). It demonstrates: the dark instrument palette, Space Grotesk / IBM Plex Mono / Archivo type system, the engineering-grid underlay, the tick-rule card strip with coordinates, the single hero fresh-snow metric, the depth data table, the 7-day histogram, the 5-day forecast strip, and the lift/trail/wind telemetry footer — with no gradients, glass, pills, pulsing dots, or emoji-as-icon.

---

## Implementation note (for whoever builds it later)

Nothing here touches `app/`, `build/`, `package.json`, or any source file. To realize Direction A:
1. Replace the palette in the active theme (`app/app.tsx`) with the Alpine Instrument tokens; delete the `palette.gradient` block in `app/theme/index.ts`.
2. Swap fonts to Space Grotesk / IBM Plex Mono / Archivo; set `h*` weights to ≤600 and reduce negative tracking.
3. Set `shape.borderRadius: 4`; flatten `shadows` to mostly `none` + hairline borders.
4. Remove gradient `::before` strips, `backdropFilter` blur, and all `float`/`pulse` keyframes.
5. Rebuild `ResortCard` body as: tick-rule → hero metric → data table → histogram → forecast → telemetry footer.
