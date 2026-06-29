import { fetchJson } from '../lib/http';
import type { Sourced, Incident } from '../lib/types';

interface MapItem {
  itemId: string;
  location: [number, number];
}

interface MapIconsResponse {
  item2: MapItem[];
}

export interface NvRoadsDetail {
  description?: string;
  roadway?: string;
  eventType?: string;
  severity?: string;
  startDate?: string;
  locationDescription?: string;
  latitude?: number;
  longitude?: number;
}

const RENO_BBOX = { latMin: 39.0, latMax: 40.5, lonMin: -120.5, lonMax: -119.0 };
const LAYERS = ['Incidents', 'Closures', 'Construction'] as const;
type Layer = typeof LAYERS[number];
const MAX_ITEMS = 15;

export function severityMap(raw: string | undefined): Incident['severity'] {
  switch (raw?.toLowerCase()) {
    case 'minor': return 'Low';
    case 'moderate': return 'Medium';
    case 'major': return 'High';
    default: return 'Unknown';
  }
}

export function parseDetail(d: NvRoadsDetail, layer: Layer): Incident {
  return {
    type: layer,
    description: d.description ?? '',
    route: d.roadway ?? '',
    location: d.locationDescription ?? '',
    severity: severityMap(d.severity),
    startTime: d.startDate ?? new Date(0).toISOString(),
    lat: d.latitude ?? null,
    lon: d.longitude ?? null,
  };
}

async function fetchLayerItems(layer: Layer): Promise<Array<{ itemId: string; layer: Layer }>> {
  try {
    const data = await fetchJson<MapIconsResponse>(
      `https://www.nvroads.com/map/mapIcons/${layer}`,
      { timeoutMs: 8000 }
    );
    return (data.item2 ?? [])
      .filter((item) => {
        const [lat, lon] = item.location ?? [];
        return (
          lat >= RENO_BBOX.latMin && lat <= RENO_BBOX.latMax &&
          lon >= RENO_BBOX.lonMin && lon <= RENO_BBOX.lonMax
        );
      })
      .map((item) => ({ itemId: item.itemId, layer }));
  } catch {
    return [];
  }
}

async function fetchDetail(itemId: string, layer: Layer): Promise<Incident | null> {
  try {
    const d = await fetchJson<NvRoadsDetail>(
      `https://www.nvroads.com/map/data/${layer}/${itemId}`,
      { timeoutMs: 8000 }
    );
    return parseDetail(d, layer);
  } catch {
    return null;
  }
}

export async function getIncidents(): Promise<Sourced<Incident[]>> {
  try {
    const layerResults = await Promise.all(LAYERS.map(fetchLayerItems));
    const candidates = layerResults.flat().slice(0, MAX_ITEMS);
    const details = await Promise.all(
      candidates.map(({ itemId, layer }) => fetchDetail(itemId, layer))
    );
    const data = details.filter((d): d is Incident => d !== null);
    return { data, source: 'NV511', fetchedAt: new Date().toISOString() };
  } catch {
    return { data: [], source: 'NV511', fetchedAt: new Date().toISOString(), stale: true };
  }
}
