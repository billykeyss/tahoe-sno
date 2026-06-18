// Caltrans CWWP2 District-3 feeds (open JSON, CORS-enabled, no key). Covers the
// three Tahoe corridors. Two datasets: chain control + lane/road closures.

import { fetchJson } from '../lib/http';
import type {
  ChainControl,
  ChainStatus,
  RoadClosure,
  RoadStatus,
  Sourced,
} from '../lib/types';

const CC_URL = 'https://cwwp2.dot.ca.gov/data/d3/cc/ccStatusD03.json';
const LCS_URL = 'https://cwwp2.dot.ca.gov/data/d3/lcs/lcsStatusD03.json';

export const TAHOE_ROUTES = ['I-80', 'US-50', 'SR-89'];

interface CcRecord {
  cc?: {
    location?: { route?: string; locationName?: string; postmile?: string };
    statusData?: { status?: string; statusDescription?: string };
  };
}

interface LcsRecord {
  lcs?: {
    location?: {
      begin?: { beginRoute?: string; beginLocationName?: string };
      end?: { endLocationName?: string };
    };
    closure?: { typeOfClosure?: string; typeOfWork?: string };
  };
}

function mapStatus(raw?: string): ChainStatus {
  switch (raw) {
    case 'R-0':
      return 'none';
    case 'R-1':
      return 'R1';
    case 'R-2':
      return 'R2';
    case 'R-3':
      return 'R3';
    default:
      return 'unknown';
  }
}

export function parseChainControls(
  records: CcRecord[],
  routes: string[]
): ChainControl[] {
  return records
    .filter((r) => r.cc?.location?.route && routes.includes(r.cc.location.route))
    .map((r) => ({
      route: r.cc!.location!.route!,
      status: mapStatus(r.cc!.statusData?.status),
      description: r.cc!.statusData?.statusDescription ?? '',
      location: r.cc!.location!.locationName ?? '',
    }));
}

export function parseClosures(
  records: LcsRecord[],
  routes: string[]
): RoadClosure[] {
  return records
    .filter(
      (r) =>
        r.lcs?.location?.begin?.beginRoute &&
        routes.includes(r.lcs.location.begin.beginRoute)
    )
    .map((r) => {
      const begin = r.lcs!.location!.begin!;
      const end = r.lcs!.location!.end ?? {};
      const location =
        end.endLocationName && end.endLocationName !== begin.beginLocationName
          ? `${begin.beginLocationName} → ${end.endLocationName}`
          : begin.beginLocationName ?? '';
      return {
        route: begin.beginRoute!,
        type: r.lcs!.closure?.typeOfClosure ?? 'Closure',
        description: r.lcs!.closure?.typeOfWork ?? '',
        location,
      };
    });
}

function toArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown[] }).data)) {
    return (raw as { data: unknown[] }).data;
  }
  return [];
}

export async function getRoads(): Promise<Sourced<RoadStatus>> {
  const [ccRaw, lcsRaw] = await Promise.all([
    fetchJson<unknown>(CC_URL, { timeoutMs: 15000 }),
    fetchJson<unknown>(LCS_URL, { timeoutMs: 20000 }),
  ]);

  return {
    data: {
      chainControls: parseChainControls(toArray(ccRaw) as CcRecord[], TAHOE_ROUTES),
      closures: parseClosures(toArray(lcsRaw) as LcsRecord[], TAHOE_ROUTES),
    },
    source: 'Caltrans',
    fetchedAt: new Date().toISOString(),
  };
}
