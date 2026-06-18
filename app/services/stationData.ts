// Client hooks for the non-weather data endpoints (snowpack, roads, alerts).
// All call our same-origin /api/* proxy and return the server's `{ data, source,
// fetchedAt }` envelope so the UI can attribute each reading.

import { useEffect, useState } from 'react';

export interface Sourced<T> {
  data: T;
  source: string;
  fetchedAt: string;
  stationId?: string;
}

export interface Snowpack {
  depth_cm: number | null;
  swe_cm: number | null;
  stationName: string;
  elevationFt: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface RoadStatusData {
  chainControls: Array<{
    route: string;
    status: 'none' | 'R1' | 'R2' | 'R3' | 'unknown';
    description: string;
    location: string;
  }>;
  closures: Array<{
    route: string;
    type: string;
    description: string;
    location: string;
  }>;
}

export interface WeatherAlert {
  event: string;
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  headline: string;
  onset: string | null;
  expires: string | null;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useJson<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as T;
      })
      .then((json) => {
        if (!cancelled) setState({ data: json, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({ data: null, loading: false, error: String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

/** Measured snowpack for a resort, or null when it has no mapped station. */
export function useSnowpack(resortId: string): {
  snowpack: Sourced<Snowpack> | null;
  loading: boolean;
} {
  const res = useJson<Sourced<Snowpack> | { data: null }>(
    `/api/snowpack?resortId=${encodeURIComponent(resortId)}`
  );
  const snowpack =
    res.data && 'source' in res.data ? (res.data as Sourced<Snowpack>) : null;
  return { snowpack, loading: res.loading };
}

export function useRoads(): FetchState<Sourced<RoadStatusData>> {
  return useJson<Sourced<RoadStatusData>>('/api/roads');
}

export function useAlerts(lat: number, lon: number): FetchState<Sourced<WeatherAlert[]>> {
  return useJson<Sourced<WeatherAlert[]>>(
    `/api/alerts?lat=${lat}&lon=${lon}`
  );
}
