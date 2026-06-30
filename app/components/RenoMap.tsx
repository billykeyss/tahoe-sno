import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Sourced, Fire, Incident } from '../services/stationData';

const RENO_CENTER: [number, number] = [-119.8138, 39.5296];

type FC = GeoJSON.FeatureCollection<GeoJSON.Point>;

function buildFireFC(fires: Sourced<Fire[]> | null): FC {
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

function buildIncidentFC(incidents: Sourced<Incident[]> | null): FC {
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
  fires: Sourced<Fire[]> | null;
  incidents: Sourced<Incident[]> | null;
}

export function RenoMap({ fires, incidents }: RenoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const firesRef = useRef(fires);
  const incidentsRef = useRef(incidents);

  useEffect(() => { firesRef.current = fires; }, [fires]);
  useEffect(() => { incidentsRef.current = incidents; }, [incidents]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: RENO_CENTER,
        zoom: 10,
        pitch: 50,
        bearing: 0,
      });
    } catch {
      return; // WebGL unavailable
    }
    mapRef.current = map;

    map.on('load', () => {
      // 3D terrain
      map.addSource('terrain', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        encoding: 'terrarium',
      });
      map.setTerrain({ source: 'terrain', exaggeration: 1.5 });

      // Fires source + layer
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

      attachPopup(map, 'fires-layer', (p) =>
        `<strong>${p['name']}</strong><br/>${Number(p['acres']).toLocaleString()} acres · ${p['containment']}% contained`
      );
      attachPopup(map, 'incidents-layer', (p) =>
        `<strong>${p['route'] || p['type']}</strong><br/>${p['description']}`
      );
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update sources when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource('fires') as maplibregl.GeoJSONSource | undefined)
      ?.setData(buildFireFC(fires));
    (map.getSource('incidents') as maplibregl.GeoJSONSource | undefined)
      ?.setData(buildIncidentFC(incidents));
  }, [fires, incidents]);

  return (
    <section className="reno-map-section">
      <div ref={containerRef} className="reno-map" />
    </section>
  );
}
