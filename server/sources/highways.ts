const OVERPASS_URL = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
const USER_AGENT = 'TahoeSno/1.0 (https://github.com/billykeyss/tahoe-sno, info@gocapsule.ai)';

// Washoe County + surrounds
const OVERPASS_QUERY = `[out:json][timeout:30][bbox:39.0,-120.5,40.5,-119.0];
(
  way["highway"="motorway"]["ref"];
  way["highway"="trunk"]["ref"];
  way["highway"="primary"]["ref"];
);
out geom;`;

interface OverpassNode { lat: number; lon: number; }
interface OverpassWay {
  type: 'way';
  id: number;
  tags: Record<string, string>;
  geometry: OverpassNode[];
}
interface OverpassResponse {
  elements: Array<OverpassWay | { type: string }>;
}

export async function getHighways(): Promise<GeoJSON.FeatureCollection<GeoJSON.LineString>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);

  let res: Response;
  try {
    res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`Overpass ${res.status}`);

  const json = await res.json() as OverpassResponse;

  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (const el of json.elements) {
    if (el.type !== 'way') continue;
    const way = el as OverpassWay;
    if (!way.geometry || way.geometry.length < 2) continue;
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: way.geometry.map((n) => [n.lon, n.lat]),
      },
      properties: {
        ref: way.tags['ref'] ?? '',
        name: way.tags['name'] ?? '',
        highway: way.tags['highway'] ?? '',
      },
    });
  }

  return { type: 'FeatureCollection', features };
}
