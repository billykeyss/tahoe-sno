import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Sourced, Fire, Incident } from '../services/stationData';

const RENO_CENTER: [number, number] = [-119.8138, 39.5296];

type PointFC = GeoJSON.FeatureCollection<GeoJSON.Point>;
type LineFC = GeoJSON.FeatureCollection<GeoJSON.LineString>;

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

// Extract the primary highway ref from an NV511 route string ("I-80 EB" → "I 80")
// NV511 uses "SR-430" for Nevada state routes; OSM uses "NV 430"
function extractRef(route: string): string | null {
  const m = route.match(/^(I|US|SR|NV|CA)-(\d+)(?:-BR|-BUS|-ALT)?/i);
  if (!m) return null;
  const prefix = m[1].toUpperCase() === 'SR' ? 'NV' : m[1].toUpperCase();
  return `${prefix} ${m[2]}`;
}

// Build a severity map: normalized OSM ref → worst severity from current incidents
function buildSeverityMap(incidents: Sourced<Incident[]> | null): Map<string, string> {
  const SEV_RANK: Record<string, number> = { High: 3, Unknown: 3, Medium: 2, Low: 1, None: 0 };
  const map = new Map<string, string>();
  for (const inc of incidents?.data ?? []) {
    const ref = extractRef(inc.route);
    if (!ref) continue;
    const cur = map.get(ref);
    const rank = SEV_RANK[inc.severity] ?? 0;
    if (!cur || rank > (SEV_RANK[cur] ?? 0)) {
      map.set(ref, inc.severity === 'Unknown' ? 'High' : inc.severity);
    }
  }
  return map;
}

// Annotate highway GeoJSON features with severity based on current incidents
function annotateHighways(base: LineFC, incidents: Sourced<Incident[]> | null): LineFC {
  const sevMap = buildSeverityMap(incidents);
  return {
    ...base,
    features: base.features.map((f) => {
      const osmRef: string = f.properties?.['ref'] ?? '';
      // OSM refs can be semicolon-separated (e.g. "I 580;US 395")
      const refs = osmRef.split(/;/).map((r) => r.trim());
      let worst = 'None';
      const SEV_RANK: Record<string, number> = { High: 3, Medium: 2, Low: 1, None: 0 };
      for (const r of refs) {
        const s = sevMap.get(r) ?? 'None';
        if ((SEV_RANK[s] ?? 0) > (SEV_RANK[worst] ?? 0)) worst = s;
      }
      return { ...f, properties: { ...f.properties, severity: worst } };
    }),
  };
}

function buildFireFC(fires: Sourced<Fire[]> | null): PointFC {
  return {
    type: 'FeatureCollection',
    features: (fires?.data ?? [])
      .filter((f) => f.lat != null && f.lon != null)
      .map((f) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lon!, f.lat!] },
        properties: { name: f.name, acres: f.acres, containment: f.containment },
      })),
  };
}

function buildIncidentFC(incidents: Sourced<Incident[]> | null): PointFC {
  return {
    type: 'FeatureCollection',
    features: (incidents?.data ?? [])
      .filter((i) => i.lat != null && i.lon != null)
      .map((i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [i.lon!, i.lat!] },
        properties: {
          type: i.type,
          description: i.description,
          route: i.route,
          severity: i.severity,
        },
      })),
  };
}

function attachPopup(
  map: maplibregl.Map,
  layerId: string,
  getHtml: (p: Record<string, unknown>) => string
) {
  map.on('click', layerId, (e) => {
    if (!e.features?.[0]) return;
    const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
    new maplibregl.Popup({ maxWidth: '260px' })
      .setLngLat(coords)
      .setHTML(getHtml(e.features[0].properties as Record<string, unknown>))
      .addTo(map);
  });
  map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
}

interface RenoMapProps {
  fires?: Sourced<Fire[]> | null;
  incidents: Sourced<Incident[]> | null;
  /** Initial camera. Defaults to the Reno/Sparks view. */
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  /** Optional labelled pin, e.g. the home mountain. */
  marker?: { lngLat: [number, number]; label: string };
  className?: string;
}

export function RenoMap({
  fires = null,
  incidents,
  center = RENO_CENTER,
  zoom = 10,
  pitch = 50,
  bearing = 0,
  marker,
  className = 'reno-map',
}: RenoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const firesRef = useRef(fires);
  const incidentsRef = useRef(incidents);
  const highwayBaseRef = useRef<LineFC | null>(null);
  // Camera + marker are initial-only; keep them in refs so the init effect
  // can stay dependency-free.
  const cameraRef = useRef({ center, zoom, pitch, bearing, marker });

  useEffect(() => { firesRef.current = fires; }, [fires]);
  useEffect(() => { incidentsRef.current = incidents; }, [incidents]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map;
    try {
      const cam = cameraRef.current;
      map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: cam.center,
        zoom: cam.zoom,
        pitch: cam.pitch,
        bearing: cam.bearing,
      });
    } catch {
      return; // WebGL unavailable
    }
    mapRef.current = map;

    if (cameraRef.current.marker) {
      const el = document.createElement('div');
      el.className = 'map-pin';
      el.innerHTML = `<span class="map-pin-dot"></span><span class="map-pin-label">${cameraRef.current.marker.label}</span>`;
      new maplibregl.Marker({ element: el, anchor: 'left' })
        .setLngLat(cameraRef.current.marker.lngLat)
        .addTo(map);
    }

    map.on('load', () => {
      // 3D terrain
      map.addSource('terrain', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        encoding: 'terrarium',
      });
      map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
      // Hillshade so the relief reads even on the flat dark basemap.
      map.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        paint: {
          'hillshade-exaggeration': 0.6,
          'hillshade-shadow-color': '#000000',
          'hillshade-highlight-color': '#3a4a5c',
          'hillshade-accent-color': '#1a212b',
        },
      });

      // Highway lines (below everything else)
      map.addSource('highways', { type: 'geojson', data: EMPTY_FC });
      map.addLayer({
        id: 'highway-lines',
        type: 'line',
        source: 'highways',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'match', ['get', 'severity'],
            'High',   '#ef4444',
            'Medium', '#f59e0b',
            'Low',    '#9ca3af',
            '#2d3748', // None — dim road hint
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            8,  ['match', ['get', 'severity'], 'High', 4, 'Medium', 3, 'Low', 2, 1],
            12, ['match', ['get', 'severity'], 'High', 7, 'Medium', 6, 'Low', 4, 2],
          ],
          'line-opacity': [
            'match', ['get', 'severity'],
            'High',   0.95,
            'Medium', 0.85,
            'Low',    0.65,
            0.3, // None
          ],
        },
      });

      // Glow layer for affected segments (drawn after base lines)
      map.addLayer({
        id: 'highway-glow',
        type: 'line',
        source: 'highways',
        filter: ['in', ['get', 'severity'], ['literal', ['High', 'Medium']]],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'match', ['get', 'severity'],
            'High',   '#ef4444',
            '#f59e0b',
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            8,  12,
            12, 20,
          ],
          'line-opacity': 0.12,
          'line-blur': 4,
        },
      });

      // Incidents source + layer
      map.addSource('incidents', { type: 'geojson', data: buildIncidentFC(incidentsRef.current) });
      map.addLayer({
        id: 'incidents-layer',
        type: 'circle',
        source: 'incidents',
        paint: {
          'circle-radius': 7,
          'circle-color': [
            'match', ['get', 'severity'],
            'High', '#ef4444',
            'Unknown', '#ef4444',
            'Medium', '#f59e0b',
            '#9ca3af',
          ],
          'circle-opacity': 0.9,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1.5,
        },
      });

      // Fires source + layer (top)
      map.addSource('fires', { type: 'geojson', data: buildFireFC(firesRef.current) });
      map.addLayer({
        id: 'fires-layer',
        type: 'circle',
        source: 'fires',
        paint: {
          'circle-radius': ['min', ['max', 6, ['/', ['sqrt', ['get', 'acres']], 1.2]], 22],
          'circle-color': '#e85d04',
          'circle-opacity': 0.85,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1.5,
        },
      });

      attachPopup(map, 'fires-layer', (p) =>
        `<strong>${p['name']}</strong><br/>${Number(p['acres']).toLocaleString()} acres · ${p['containment']}% contained`
      );
      attachPopup(map, 'incidents-layer', (p) =>
        `<strong>${p['route'] || p['type']}</strong><br/>${p['description']}`
      );

      // Async fetch highway geometry — non-blocking, map works without it
      fetch('/api/highways')
        .then((r) => r.json())
        .then((geojson: LineFC) => {
          highwayBaseRef.current = geojson;
          const annotated = annotateHighways(geojson, incidentsRef.current);
          (map.getSource('highways') as maplibregl.GeoJSONSource)?.setData(annotated);
        })
        .catch(() => {});
    });

    // The container can be laid out after MapLibre measures it (CSS arriving
    // late in dev, or a tab that mounts hidden), so track its size.
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  // Update sources when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource('fires') as maplibregl.GeoJSONSource | undefined)
      ?.setData(buildFireFC(fires));
    (map.getSource('incidents') as maplibregl.GeoJSONSource | undefined)
      ?.setData(buildIncidentFC(incidents));
    if (highwayBaseRef.current) {
      const annotated = annotateHighways(highwayBaseRef.current, incidents);
      (map.getSource('highways') as maplibregl.GeoJSONSource | undefined)
        ?.setData(annotated);
    }
  }, [fires, incidents]);

  return (
    <section className="reno-map-section">
      <div ref={containerRef} className={className} />
    </section>
  );
}

