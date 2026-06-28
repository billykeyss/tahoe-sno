# /reno Page — Reno/Sparks City Intelligence Feed

**Date:** 2026-06-27  
**Route:** `/reno`  
**Purpose:** A single-page dashboard of real-time safety and city-status data for the Reno/Sparks/Washoe County area — fires, emergency alerts (AMBER, Red Flag, etc.), air quality, and road incidents/construction. Styled to match the existing Alpine Instrument theme.

---

## Data Sources

| Panel | Source | Endpoint | Cache | Auth |
|-------|--------|----------|-------|------|
| Active Fires | NIFC WFIGS ArcGIS FeatureServer | `services3.arcgis.com/.../Active_Fires/FeatureServer/0/query` | 30 min | None |
| Emergency Alerts | NWS `api.weather.gov` (existing source) | `/alerts/active?point=39.5296,-119.8138` | 5 min | None |
| Air Quality | OpenAQ v3 | `api.openaq.org/v3/locations?coordinates=39.5296,-119.8138&radius=40000` | 60 min | None (free key optional) |
| Incidents / Construction | Nevada 511 / NVRoads | `www.nvroads.com` REST API — verify endpoint during impl | 5 min | None (public) |

**Reno bounding box** (NIFC + incidents): `39.1, -120.5` → `40.3, -119.3` (covers Reno, Sparks, most of Washoe County).

---

## Architecture

### Server

Four new or reused server pieces:

1. **`server/sources/nifc.ts`** — queries NIFC WFIGS FeatureServer with the Reno bbox. Returns array of `{ name, acres, containment, updatedAt, lat, lon }`. Strips inactive/fully-contained fires.

2. **`server/sources/openaq.ts`** — queries OpenAQ for the nearest active monitoring stations in Washoe County. Returns `{ aqi, category, pm25, pm10, o3, stationName, measuredAt }`. If no recent reading (<2hr old), returns `null`.

3. **`server/sources/nevada511.ts`** — queries NVRoads for active events (incidents, construction, closures) within the Reno bbox. Returns array of `{ type, description, route, severity, startTime }`.

4. **NWS alerts** — reuse existing `getAlerts()` from `server/sources/nws.ts`, called with Reno's point `(39.5296, -119.8138)`. No new source file needed.

**New routes in `server/app.ts`:**

```
GET /api/fires          → NIFC, cached 30 min
GET /api/aqi            → OpenAQ, cached 60 min (no params — fixed Reno point)
GET /api/incidents      → Nevada 511, cached 5 min
GET /api/alerts         → already exists; client calls with Reno lat/lon
```

All routes follow the existing error shape: `{ error, detail }` on failure.

### Client

**New hook** in `app/services/stationData.ts` (same pattern as `useRoads`/`useAlerts`):
- `useFires()` → `AsyncState<Fire[]>`
- `useAQI()` → `AsyncState<AQIReading | null>`
- `useIncidents()` → `AsyncState<Incident[]>`

NWS alerts reuse `useAlerts(39.5296, -119.8138)`.

**New route file:** `app/routes/reno.tsx`

Page layout (top → bottom):
1. **Page header** — "RENO · SPARKS" in the same `HeroHeadline` style; brief description line
2. **Summary strip** (`RegionReadout`) — fire count, alert count, AQI category, open incident count
3. **Alert panels** (render nothing when empty, like `AlertBanner`):
   - `FirePanel` — active fires; each row: name · acres · containment% · "EmergencyWashoe ↗" link pinned to panel header
   - `AlertsPanel` — NWS alerts (AMBER, Red Flag, weather); reuses `AlertBanner` DNA
   - `AQIPanel` — AQI gauge + category label (Good/Moderate/Unhealthy etc.); amber/red accent when ≥ Moderate
   - `IncidentsPanel` — road incidents and construction rows
4. **Footer** — source attribution strip (NIFC · NWS · OpenAQ · NV511)

Each panel is independently loading; a panel shows a skeleton row while its data loads and collapses if empty (no alerts, no fires, etc.).

**Topbar update:** Add a `RENO` nav link alongside the existing `BC` toggle. When on `/reno`, highlight it; clicking from `/reno` returns to `/`.

**`app/routes.tsx` update:** Add `route('reno', './routes/reno.tsx')`.

---

## Styling

Follow Alpine Instrument conventions:
- Fire/alert panels use the existing `alert-banner` class structure; fire-specific accent is `--col-fire: #e85d04` (orange, distinct from the existing amber alert accent)
- AQI uses a 5-step color ramp matching EPA categories (green → yellow → orange → red → purple)
- Panel headers use `.alert-tag` style (monospace chip)
- Empty panels render `null` — no "No active fires" placeholders cluttering the page

---

## Error Handling

- Each panel fetches independently; one source failure doesn't block others
- On upstream error, panel shows a muted "source unavailable" row (not an error toast)
- Nevada 511 endpoint TBD — if not viable at implementation time, drop the panel and note it

---

## Out of Scope

- Push notifications / service worker alerts
- Historical fire data or trend charts
- Map view (could be a future addition)
- Reno city/Sparks city RSS feed scraping (no clean API)
