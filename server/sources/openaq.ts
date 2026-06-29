import { fetchJson } from '../lib/http';
import type { Sourced, AQIReading } from '../lib/types';

interface AirNowObservation {
  DateObserved: string;
  HourObserved: number;
  ReportingArea: string;
  ParameterName: string;
  AQI: number;
  Category: { Number: number; Name: string };
}

const RENO_LAT = 39.5296;
const RENO_LON = -119.8138;

const VALID_CATS = new Set<AQIReading['category']>([
  'Good',
  'Moderate',
  'Unhealthy for Sensitive Groups',
  'Unhealthy',
  'Very Unhealthy',
  'Hazardous',
]);

// Kept for tests and callers that compute category from raw PM2.5 μg/m³.
export function pm25Category(pm25: number): AQIReading['category'] {
  if (pm25 <= 12.0) return 'Good';
  if (pm25 <= 35.4) return 'Moderate';
  if (pm25 <= 55.4) return 'Unhealthy for Sensitive Groups';
  if (pm25 <= 150.4) return 'Unhealthy';
  if (pm25 <= 250.4) return 'Very Unhealthy';
  return 'Hazardous';
}

export function parseAQI(obs: AirNowObservation[]): AQIReading | null {
  const reading = (obs ?? []).find(
    (o) => o.ParameterName === 'PM2.5' && typeof o.AQI === 'number' && o.AQI >= 0
  );
  if (!reading) return null;
  const catName = reading.Category?.Name ?? '';
  if (!VALID_CATS.has(catName as AQIReading['category'])) return null;
  return {
    pm25: reading.AQI,
    category: catName as AQIReading['category'],
    stationName: reading.ReportingArea ?? 'Reno',
    measuredAt: new Date().toISOString(),
  };
}

export async function getAQI(): Promise<Sourced<AQIReading | null>> {
  const key = process.env.AIRNOW_API_KEY;
  if (!key) {
    return { data: null, source: 'AirNow', fetchedAt: new Date().toISOString(), stale: true };
  }
  const url =
    `https://www.airnowapi.org/aq/observation/latLong/current/` +
    `?format=application/json&latitude=${RENO_LAT}&longitude=${RENO_LON}&distance=25&API_KEY=${key}`;
  const raw = await fetchJson<AirNowObservation[]>(url, { timeoutMs: 12000 });
  return { data: parseAQI(raw), source: 'AirNow', fetchedAt: new Date().toISOString() };
}
