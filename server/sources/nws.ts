// NWS (api.weather.gov) — free, no key. We use it for official weather alerts
// (winter storm warnings, etc.); snow totals stay with Open-Meteo. A descriptive
// User-Agent is mandatory (handled in lib/http).

import { fetchJson } from '../lib/http';
import type { Sourced, WeatherAlert } from '../lib/types';

interface NwsAlertsRaw {
  features: Array<{
    properties: {
      event: string;
      severity: string;
      headline: string;
      onset: string | null;
      expires: string | null;
    };
  }>;
}

const SEVERITIES = ['Extreme', 'Severe', 'Moderate', 'Minor'] as const;

function normalizeSeverity(raw: string): WeatherAlert['severity'] {
  return (SEVERITIES as readonly string[]).includes(raw)
    ? (raw as WeatherAlert['severity'])
    : 'Unknown';
}

export function parseAlerts(raw: NwsAlertsRaw): WeatherAlert[] {
  return (raw.features ?? []).map((f) => ({
    event: f.properties.event,
    severity: normalizeSeverity(f.properties.severity),
    headline: f.properties.headline,
    onset: f.properties.onset,
    expires: f.properties.expires,
  }));
}

export async function getAlerts(
  lat: number,
  lon: number
): Promise<Sourced<WeatherAlert[]>> {
  // 4-decimal cap; extra precision triggers a 301.
  const point = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const raw = await fetchJson<NwsAlertsRaw>(
    `https://api.weather.gov/alerts/active?point=${point}`,
    { timeoutMs: 10000 }
  );

  return {
    data: parseAlerts(raw),
    source: 'NWS',
    fetchedAt: new Date().toISOString(),
  };
}
