# /reno Map — 3D Terrain Traffic & Fire Map

**Date:** 2026-06-29
**Route:** `/reno` (addition to existing page)
**Purpose:** Full-width 3D terrain map showing active fires and road incidents/closures around Reno/Sparks/Washoe County. Consumes data already fetched by the existing `/reno` page hooks.

---

## Data Sources

No new server endpoints. Reuses:
| Hook | Data | Markers |
|------|------|---------|
| `useFires()` | NIFC WFIGS active fires with lat/lon | Orange flame markers, radius scales with acres |
| `useIncidents()` | NV511 incidents/closures/construction | Red (High/Unknown), yellow (Medium), grey (Low) markers |

---

## Architecture

### New component: `app/components/RenoMap.tsx`

Client-only MapLibre GL JS map. Props:
```ts
interface RenoMapProps {
  fires: Sourced<Fire[]> | null;
  incidents: Sourced<Incident[]> | null;
}
```

Mount behavior:
- Initialize MapLibre map in a `useEffect`, destroy on unmount
- Base style: OpenFreeMap outdoor (`https://tiles.openfreemap.org/styles/outdoor`) — free, no key, terrain contours
- Terrain DEM source: AWS Terrarium tiles (`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`) — free, no key
- Enable 3D terrain: `map.setTerrain({ source: 'terrain', exaggeration: 1.5 })`
- Initial camera: center `[−119.8138, 39.5296]`, zoom `10`, pitch `50`, bearing `0`

Data rendering:
- Add fires as a GeoJSON source + circle layer (orange, radius `max(6, sqrt(acres) * 0.8)` clamped to 20)
- Add incidents as a GeoJSON source + circle layer (color from severity: High/Unknown → `#ef4444`, Medium → `#f59e0b`, Low → `#6b7280`)
- On marker click: show a MapLibre popup with name/description, route, severity, startTime

SSR guard: wrap in `typeof window !== 'undefined'` check; render `null` on server.

### Page integration: `app/routes/reno.tsx`

Add `<RenoMap fires={fires.data} incidents={incidents.data} />` as a full-width section below the existing panels, above the footer. No layout changes to existing panels.

### Styling

Add to `instrument.css`:
```css
.reno-map { width: 100%; height: 420px; border-radius: 4px; overflow: hidden; margin: var(--sp-4) 0; }
.maplibregl-popup-content { background: var(--bg-2); color: var(--fg-1); border: 1px solid var(--border); font-family: var(--font-mono); font-size: 12px; }
```

No height on mobile — collapses to 260px via media query.

### Dependency

Add `maplibre-gl` to `package.json`. Import its CSS in the component (`import 'maplibre-gl/dist/maplibre-gl.css'`).

---

## Error Handling

- No fires or no incidents: source added with empty FeatureCollection, no markers shown, map still renders
- WebGL unavailable: MapLibre throws on init; catch and render `null` (same null pattern as other panels)
- Marker with null lat/lon (fires can have null): filter those out before building GeoJSON

---

## Out of Scope

- Real-time map updates (data refreshes through existing hook TTL)
- Custom SVG icons (circles are sufficient)
- Map controls (zoom buttons unnecessary at this viewport size — scroll/pinch still works)
- Legend (severity colors are intuitive enough at this stage)
