import { fetchJson } from '../lib/http';
import type { Sourced, AQIReading } from '../lib/types';

interface OpenAQSensor {
  id: number;
  parameter: { name: string };
  latest: { value: number; datetime: { utc: string } } | null;
}

interface OpenAQLocation {
  id: number;
  name: string;
  sensors: OpenAQSensor[];
}

interface OpenAQResponse {
  results: OpenAQLocation[];
}

const RENO_LAT = 39.5296;
const RENO_LON = -119.8138;

const OPENAQ_URL =
  `https://api.openaq.org/v3/locations?coordinates=${RENO_LAT},${RENO_LON}` +
  '&radius=40000&limit=5&order_by=distance&parameters_name=pm25';

export function pm25Category(pm25: number): AQIReading['category'] {
  if (pm25 <= 12.0) return 'Good';
  if (pm25 <= 35.4) return 'Moderate';
  if (pm25 <= 55.4) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 150.4) return 'Unhealthy';
  if (pm25 <= 250.4) return 'Very Unhealthy';
  return 'Hazardous';
}

export function parseAQI(raw: OpenAQResponse): AQIReading | null {
  for (const loc of raw.results ?? []) {
    const sensor = (loc.sensors ?? []).find(
      (s) => s.parameter.name === 'pm25' && s.latest != null
    );
    if (!sensor?.latest) continue;
    const measuredAt = sensor.latest.datetime.utc;
    const ageMs = Date.now() - new Date(measuredAt).getTime();
    if (ageMs > 2 * 60 * 60 * 1000) continue; // skip readings older than 2hr
    return {
      pm25: sensor.latest.value,
      category: pm25Category(sensor.latest.value),
      stationName: loc.name,
      measuredAt,
    };
  }
  return null;
}

export async function getAQI(): Promise<Sourced<AQIReading | null>> {
  const raw = await fetchJson<OpenAQResponse>(OPENAQ_URL, { timeoutMs: 12000 });
  return { data: parseAQI(raw), source: 'OpenAQ', fetchedAt: new Date().toISOString() };
}
