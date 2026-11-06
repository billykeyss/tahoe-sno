// NDOT traffic cameras (nvroads.com) along the Mt Rose Highway (SR-431) — the
// only public live cams on the drive and at the ski-area entrance. Each site
// serves a still (refreshed ~60s, CORS-open) and an HLS stream. We fetch the
// per-site detail on the server so stream URLs stay current, and fall back to
// the still-only entry if a detail call fails.

import { fetchJson } from '../lib/http';
import type { Camera, Sourced } from '../lib/types';

const BASE = 'https://www.nvroads.com';

/** The pass and the ski-area entrance first, then the rest in drive order. */
export const MT_ROSE_CAMERAS: Array<{ id: string; label: string }> = [
  { id: '7428', label: 'Mt Rose Summit' },
  { id: '7881', label: 'Ski area entrance' },
  { id: '7828', label: 'Bullseye (lower highway)' },
  { id: '7827', label: 'The Dugway' },
  { id: '7792', label: 'West side meadows' },
  { id: '7429', label: 'Diamond Peak turnoff' },
  { id: '7430', label: 'Country Club Dr (Incline)' },
];

interface NvCameraDetail {
  location?: string;
  roadway?: string;
  images?: Array<{ imageUrl?: string; videoUrl?: string; videoDisabled?: boolean; disabled?: boolean }>;
  latLng?: { geography?: { wellKnownText?: string } };
}

function parsePoint(wkt: string | undefined): { lat: number | null; lon: number | null } {
  const m = wkt?.match(/POINT \(([-\d.]+) ([-\d.]+)\)/);
  return m ? { lon: Number(m[1]), lat: Number(m[2]) } : { lat: null, lon: null };
}

export function parseCamera(id: string, label: string, d: NvCameraDetail | null): Camera {
  const img = d?.images?.find((i) => !i.disabled) ?? null;
  const { lat, lon } = parsePoint(d?.latLng?.geography?.wellKnownText);
  return {
    id,
    label,
    location: d?.location ?? d?.roadway ?? `SR-431 camera ${id}`,
    imageUrl: `${BASE}${img?.imageUrl ?? `/map/Cctv/${id}`}`,
    videoUrl: img && !img.videoDisabled && img.videoUrl ? img.videoUrl : null,
    lat,
    lon,
  };
}

export async function getCameras(): Promise<Sourced<Camera[]>> {
  const data = await Promise.all(
    MT_ROSE_CAMERAS.map(async ({ id, label }) => {
      try {
        const d = await fetchJson<NvCameraDetail>(`${BASE}/map/data/Cameras/${id}`, {
          timeoutMs: 8000,
        });
        return parseCamera(id, label, d);
      } catch {
        return parseCamera(id, label, null);
      }
    })
  );
  return { data, source: 'NV511', fetchedAt: new Date().toISOString() };
}
