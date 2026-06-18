// Shared types for the TahoeSno data proxy. Every payload that leaves the
// server is wrapped in `Sourced<T>` so the UI can attribute it.

export interface Sourced<T> {
  data: T;
  /** Human-readable provenance shown in the UI, e.g. "CDEC", "NWS", "Caltrans". */
  source: string;
  /** ISO timestamp of when the server fetched/derived this. */
  fetchedAt: string;
  /** Optional upstream station/zone identifier. */
  stationId?: string;
  /** True when this is a graceful fallback / no live data was available. */
  stale?: boolean;
}

export interface NormalizedWeather {
  temp_c: number;
  wind_speed_mph: number;
  weather_desc: string;
  freshsnow_cm: number;
  base_depth_cm: number;
  upper_depth_cm: number;
  forecast: Array<{
    date: string;
    temp_high_c: number;
    temp_low_c: number;
    freshsnow_cm: number;
    condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'snow' | 'rain';
  }>;
  historical_snow: Array<{ date: string; snow_cm: number }>;
}

export interface WeatherAlert {
  event: string; // e.g. "Winter Storm Warning"
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  headline: string;
  onset: string | null;
  expires: string | null;
}

export interface Snowpack {
  /** Measured snow depth at the station, cm. */
  depth_cm: number | null;
  /** Snow-water-equivalent at the station, cm. */
  swe_cm: number | null;
  stationName: string;
  elevationFt: number;
  /** How confident the resort→station match is. */
  confidence: 'high' | 'medium' | 'low';
}

export type ChainStatus = 'none' | 'R1' | 'R2' | 'R3' | 'unknown';

export interface ChainControl {
  route: string; // "I-80" | "US-50" | "SR-89"
  status: ChainStatus;
  description: string;
  location: string;
}

export interface RoadClosure {
  route: string;
  type: string; // "Full" | "Lane" | ...
  description: string;
  location: string;
}

export interface RoadStatus {
  chainControls: ChainControl[];
  closures: RoadClosure[];
}
