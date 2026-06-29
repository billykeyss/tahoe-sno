import { fetchJson } from '../lib/http';
import type { Sourced, Incident } from '../lib/types';

interface Nv511Record {
  EventType?: string;
  Description?: string;
  Road?: string;
  Location?: string;
  Severity?: string;
  StartDate?: string;
}

// Verify this endpoint during implementation. If it returns XML, switch to
// legacyFetchText + regex extraction for each field.
const NV511_URL =
  'https://www.nvroads.com/incidentshare/list/get-records' +
  '?format=json&county=Washoe';

const VALID_SEVERITIES = new Set(['Low', 'Medium', 'High']);

function normalizeSeverity(raw: string | undefined): Incident['severity'] {
  return VALID_SEVERITIES.has(raw ?? '') ? (raw as Incident['severity']) : 'Unknown';
}

export function parseIncidents(records: Nv511Record[]): Incident[] {
  return records.map((r) => ({
    type: r.EventType ?? 'Unknown',
    description: r.Description ?? '',
    route: r.Road ?? '',
    location: r.Location ?? '',
    severity: normalizeSeverity(r.Severity),
    startTime: r.StartDate ?? new Date().toISOString(),
  }));
}

export async function getIncidents(): Promise<Sourced<Incident[]>> {
  try {
    const raw = await fetchJson<Nv511Record[]>(NV511_URL, { timeoutMs: 10000 });
    return { data: parseIncidents(raw), source: 'NV511', fetchedAt: new Date().toISOString() };
  } catch {
    // NV511 endpoint unverified — return empty rather than breaking the page
    return { data: [], source: 'NV511', fetchedAt: new Date().toISOString(), stale: true };
  }
}
