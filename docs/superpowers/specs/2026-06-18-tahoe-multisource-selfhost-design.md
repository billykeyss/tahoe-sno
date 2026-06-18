# TahoeSno — Multi-Source Data Layer + Self-Hosting Design

**Date:** 2026-06-18
**Status:** Draft for review

## Goal

Replace the dropped SkiAPI/mock "resort report" with a set of **real, free, no-key**
data sources, fetched **server-side** (to bypass browser CORS and keep the data
flow clean), and **self-host** the result on the user's home Mac mini ("cortex").
Every datum is attributed to its source in the UI. Adds Caltrans road/highway
status for the Tahoe corridors.

## Decisions already made (this conversation)

- **Drop** the SkiAPI integration: it covered only 4 resorts and the other sources were mock data.
- **Add** free, no-key sources: **CDEC** + **SNOTEL** (snowpack), **NWS** (forecast + alerts), **Caltrans** (roads). Keep **Open-Meteo** for forecast snowfall/depth.
- **Show data provenance** per source in the UI ("src: CDEC", etc.).
- **Add I-80 / nearby highway status** (US-50, SR-89) via Caltrans.
- **Architecture:** keep the static SPA; add a small **Node `/api` proxy** rather than flipping the whole app to SSR — this avoids forcing SSR-safety onto the in-progress "Alpine Instrument" redesign.
- **Hosting:** self-host on **cortex** (Mac mini, always-on). $0, no cold starts, full control. Render rejected (no serverless; cheapest warm option is $7/mo).
- **Exposure:** via **Tailscale** (already installed), not Cloudflare.

## Architecture

```
Browser (static SPA, ssr:false)
        │  same-origin fetch /api/*
        ▼
Node server on cortex  (one process, one port)
  ├── serves build/client (static assets)
  └── /api/* proxy + normalize + TTL cache
        │  server-side fetch (no CORS, UA header, cached)
        ▼
  Open-Meteo · NWS · CDEC · SNOTEL(AWDB) · Caltrans
        ▲
        └── exposed to user's devices via Tailscale Serve (private) or Funnel (public)
```

One origin for SPA + API → no CORS between front and back. The Node server is the
only thing that talks to third parties.

## Backend modules (Node server)

Server framework: **Hono** (tiny, modern) serving static files + JSON routes.
Each source gets one module returning a **normalized** shape stamped with
`source` and `fetchedAt`. An in-memory **TTL cache** fronts every upstream call
(protects the gov APIs and keeps responses fast).

| Endpoint | Sources | Returns | Cache TTL |
|---|---|---|---|
| `GET /api/weather?lat&lon` | Open-Meteo (+ NWS forecast) | temp, wind, forecast, fresh/forecast snow | ~15 min |
| `GET /api/alerts?lat&lon` | NWS `/alerts/active` | active weather advisories/warnings | ~5 min |
| `GET /api/snowpack?resortId` | CDEC (primary) + SNOTEL (where available) | **measured** base depth + snow-water-equivalent at nearest station | ~1–3 h |
| `GET /api/roads` | Caltrans | I-80 / US-50 / SR-89 chain control + closures | ~5 min |

Normalized datum shape (illustrative):
```ts
interface Sourced<T> { data: T; source: string; fetchedAt: string; stationId?: string }
```

### Source notes / known unknowns (to finalize during implementation)
- **NWS:** 2-step lookup `GET /points/{lat},{lon}` → forecast URL; requires a descriptive `User-Agent`. CORS-friendly but proxied for caching uniformity.
- **CDEC:** JSON servlet (`/dynamicapp/req/JSONDataServlet`) for snow sensors (SWE / snow depth). **Per-resort → nearest snow-sensor station mapping is TBD.** CDEC is the primary snowpack source for the Sierra.
- **SNOTEL / NRCS AWDB:** REST API; **sparse in the CA Sierra**, so it's a supplement to CDEC, not the primary.
- **Caltrans:** chain control / closures for the corridors (QuickMap / Lane Closure System). **Exact endpoint + format TBD**; may require light parsing. The repo already has a `ChainControl` interface to build on.

## Frontend changes

- `apiClient.ts`: point existing weather fetch at same-origin `/api/weather`; add `getSnowpack(resortId)`, `getAlerts()`, `getRoads()`.
- **Attribution UI:** small monospace `src: <SOURCE>` + "updated <time>" caption under each data block (fits the Alpine Instrument look). Driven by `source`/`fetchedAt`.
- **Road panel:** a regional strip above the resort grid (roads are regional, not per-resort). Shows I-80 / US-50 / SR-89 status.
- **Remove** the dropped feature: `resortAPIs.ts`, `ResortReportSection.tsx`, the report `useEffect` in `ResortCard`, `.env.example`, and their tests. (Coordinate with the in-progress redesign, which already touches `ResortCard`.)
- **Dev workflow:** `vite` (4200) proxies `/api` → the Node server, so local dev mirrors prod.

## Self-hosting / ops (on cortex)

- **Process manager:** native **launchd** plist (survives reboot, no extra dep) — or `pm2` if preferred.
- **Keep-awake:** `sudo pmset -a sleep 0 disablesleep 1` (Mac mini as a server).
- **Deploy:** git-based — clone/pull on cortex → `npm ci && npm run build` → restart the service. Provided as `scripts/deploy-cortex.sh`.
- **Expose:** `tailscale serve` (private HTTPS within the tailnet) or `tailscale funnel` (public). Recommend **Serve/private** unless public sharing is wanted.
- Runtime: cortex needs Node ≥ 20 (laptop has v22).

## Phased build (each independently shippable)

0. **Backend scaffold** — Hono server serving `build/client` + `/api/health`; dev proxy; deploy script + launchd plist.
1. **Weather + alerts** — move Open-Meteo server-side; add NWS alerts; attribution UI on weather blocks.
2. **Snowpack** — CDEC (+ SNOTEL) with per-resort station mapping; measured base/SWE on cards.
3. **Roads** — Caltrans regional panel.
4. **Cleanup** — remove SkiAPI/`resortAPIs`/`ResortReportSection` + tests.
5. **Deploy to cortex** — bring-up + Tailscale exposure.

## Open decisions (need your input on review)

1. **Reaching cortex:** Tailscale is stopped here and I can't see the mini, so I can't deploy to it from this laptop. Do you want to (a) run the documented bring-up commands on cortex yourself, or (b) start Tailscale + enable Tailscale SSH so I can do it?
2. **Exposure:** private (Tailscale Serve — just your devices) or public (Tailscale Funnel — shareable URL)?
3. **Process manager:** launchd (recommended, native) vs pm2?

## Out of scope / risks

- Not migrating to SSR; not adding auth; not a production SLA (home uptime).
- Exposing a home machine to the network is security-sensitive — mitigated by Tailscale (no open ports). Public Funnel would widen exposure; confirm before enabling.
- Station→resort mappings and Caltrans feed specifics are the main implementation unknowns.
