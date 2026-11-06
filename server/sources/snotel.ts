// NRCS SNOTEL via the AWDB REST API — measured snowpack for the Nevada side of
// Tahoe, where CDEC has no sensors. Mt Rose has its own SNOTEL site at 8,810 ft
// inside the ski area boundary, so this is the best base-conditions reading we
// can get. Elements: SNWD = snow depth (in), WTEQ = snow-water-equivalent (in),
// TOBS = observed air temperature (°F). Daily duration, oldest first.

import { fetchJson } from '../lib/http';
import type { Snowpack, SnowpackDay, Sourced } from '../lib/types';

const API = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data';

export interface SnotelStation {
  triplet: string; // "652:NV:SNTL"
  name: string;
  elevationFt: number;
}

type Confidence = 'high' | 'medium' | 'low';

export const SNOTEL_STATIONS: Record<string, SnotelStation> = {
  MTROSE: { triplet: '652:NV:SNTL', name: 'Mt Rose Ski Area SNOTEL', elevationFt: 8810 },
};

/** Resorts that read better from a SNOTEL site than from the CDEC map. */
export const RESORT_SNOTEL: Record<string, { station: string; confidence: Confidence }> = {
  mtrose: { station: 'MTROSE', confidence: 'high' },
  diamond: { station: 'MTROSE', confidence: 'medium' },
};

export interface AwdbResponse {
  stationTriplet: string;
  data: Array<{
    stationElement: { elementCode: string; storedUnitCode: string };
    values: Array<{ date: string; value: number | null }>;
  }>;
}

const inToCm = (inches: number) => Math.round(inches * 2.54 * 10) / 10;
const fToC = (f: number) => Math.round(((f - 32) * 5) / 9 * 10) / 10;

export function parseSnotel(
  raw: AwdbResponse[],
  station: SnotelStation,
  confidence: Confidence
): Snowpack {
  const byDate = new Map<string, SnowpackDay>();
  const series = raw[0]?.data ?? [];
  for (const el of series) {
    const code = el.stationElement.elementCode;
    for (const v of el.values) {
      if (v.value == null) continue;
      const day = byDate.get(v.date) ?? {
        date: v.date,
        depth_cm: null,
        swe_cm: null,
        temp_c: null,
      };
      // Negative depth/SWE is sensor noise near zero — clamp rather than show it.
      if (code === 'SNWD') day.depth_cm = inToCm(Math.max(0, v.value));
      else if (code === 'WTEQ') day.swe_cm = inToCm(Math.max(0, v.value));
      else if (code === 'TOBS') day.temp_c = fToC(v.value);
      byDate.set(v.date, day);
    }
  }
  const history = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const lastDepth = [...history].reverse().find((d) => d.depth_cm != null);
  const lastSwe = [...history].reverse().find((d) => d.swe_cm != null);
  return {
    depth_cm: lastDepth?.depth_cm ?? null,
    swe_cm: lastSwe?.swe_cm ?? null,
    stationName: station.name,
    elevationFt: station.elevationFt,
    confidence,
    history,
  };
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Measured snowpack + 30-day history for a SNOTEL-mapped resort, else null. */
export async function getSnotelSnowpack(
  resortId: string,
  days = 30
): Promise<Sourced<Snowpack> | null> {
  const match = RESORT_SNOTEL[resortId];
  if (!match) return null;
  const station = SNOTEL_STATIONS[match.station];

  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const params = new URLSearchParams({
    stationTriplets: station.triplet,
    elements: 'SNWD,WTEQ,TOBS',
    duration: 'DAILY',
    beginDate: ymd(start),
    endDate: ymd(end),
  });
  const raw = await fetchJson<AwdbResponse[]>(`${API}?${params}`, { timeoutMs: 12000 });
  return {
    data: parseSnotel(raw, station, match.confidence),
    source: 'SNOTEL',
    stationId: station.triplet,
    fetchedAt: new Date().toISOString(),
  };
}
