// CDEC (California Data Exchange Center) snow sensors — primary measured
// snowpack source for the Sierra. Sensor 18 = SNOW DP (depth, in),
// 3 = SNOW WC (SWE, in). `-9999` means missing. No CORS → must be server-side.

import { legacyFetchJson } from '../lib/http';
import type { Snowpack, Sourced } from '../lib/types';
import { stationForResort, type StationMeta } from './stations';

const SERVLET = 'https://cdec.water.ca.gov/dynamicapp/req/JSONDataServlet';
const DEPTH_SENSOR = 18;
const SWE_SENSOR = 3;
const MISSING = -9999;

export interface CdecRow {
  stationId: string;
  SENSOR_NUM: number;
  date: string; // "2025-12-15 00:00"
  value: number | null;
  units?: string;
  sensorType?: string;
}

const inToCm = (inches: number) => Math.round(inches * 2.54 * 10) / 10;

/** Latest non-missing value for a sensor, or null. */
function latestValid(rows: CdecRow[], sensorNum: number): number | null {
  const valid = rows
    .filter(
      (r) => r.SENSOR_NUM === sensorNum && r.value != null && r.value !== MISSING
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const last = valid[valid.length - 1];
  return last ? last.value : null;
}

export function parseCdecSnowpack(
  rows: CdecRow[],
  meta: StationMeta,
  confidence: 'high' | 'medium' | 'low'
): Snowpack {
  // Negative depth/SWE is physically impossible — it's sensor noise near zero
  // (melt/recalibration). Clamp to 0 rather than show a negative reading.
  const clampToCm = (inches: number | null) =>
    inches == null ? null : inToCm(Math.max(0, inches));

  const depthIn = latestValid(rows, DEPTH_SENSOR);
  const sweIn = latestValid(rows, SWE_SENSOR);
  return {
    depth_cm: clampToCm(depthIn),
    swe_cm: clampToCm(sweIn),
    stationName: meta.name,
    elevationFt: meta.elevationFt,
    confidence,
  };
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Fetch measured snowpack for a resort, or null if it has no mapped station. */
export async function getSnowpack(
  resortId: string
): Promise<Sourced<Snowpack> | null> {
  const match = stationForResort(resortId);
  if (!match) return null;

  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86400000);
  const url =
    `${SERVLET}?Stations=${match.meta.id}` +
    `&SensorNums=${DEPTH_SENSOR},${SWE_SENSOR}` +
    `&dur_code=D&Start=${ymd(start)}&End=${ymd(end)}`;

  const rows = await legacyFetchJson<CdecRow[]>(url, { timeoutMs: 12000 });
  return {
    data: parseCdecSnowpack(rows, match.meta, match.confidence),
    source: 'CDEC',
    stationId: match.meta.id,
    fetchedAt: new Date().toISOString(),
  };
}
