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

export type Condition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'snow' | 'rain';

export interface HourlyPoint {
  time: string; // local ISO hour, e.g. "2026-11-05T14:00"
  temp_c: number;
  snow_cm: number;
  wind_mph: number;
  gust_mph: number;
  /** Freezing level above sea level, metres (null when the model has none). */
  freezing_level_m: number | null;
}

export interface NormalizedWeather {
  temp_c: number;
  wind_speed_mph: number;
  wind_gust_mph: number;
  /** Current freezing level, metres ASL. */
  freezing_level_m: number | null;
  weather_desc: string;
  freshsnow_cm: number;
  base_depth_cm: number;
  upper_depth_cm: number;
  forecast: Array<{
    date: string;
    temp_high_c: number;
    temp_low_c: number;
    freshsnow_cm: number;
    wind_mph: number;
    gust_mph: number;
    condition: Condition;
  }>;
  /** Last 7 days, oldest first (kept for the resort cards). */
  historical_snow: Array<{ date: string; snow_cm: number }>;
  /** Last 14 days, oldest first. */
  snow_history: Array<{ date: string; snow_cm: number }>;
  /** Next 24 hours from the current hour. */
  hourly: HourlyPoint[];
}

export interface WeatherAlert {
  event: string; // e.g. "Winter Storm Warning"
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  headline: string;
  onset: string | null;
  expires: string | null;
}

export interface SnowpackDay {
  date: string; // YYYY-MM-DD
  depth_cm: number | null;
  swe_cm: number | null;
  temp_c: number | null;
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
  /** Daily readings, oldest first (SNOTEL stations only). */
  history?: SnowpackDay[];
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

export interface Fire {
  name: string;
  acres: number;
  containment: number; // 0–100
  type: string;        // e.g. "WF" (wildfire)
  updatedAt: string;   // ISO string
  lat: number | null;
  lon: number | null;
}

export interface AQIReading {
  pm25: number;
  category: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  stationName: string;
  measuredAt: string; // ISO string
}

export interface Incident {
  type: string;        // "Accident" | "Construction" | "Road Condition" | "Event"
  description: string;
  route: string;       // e.g. "I-80", "US-395"
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Unknown';
  startTime: string;   // ISO string
  lat: number | null;
  lon: number | null;
}

export interface Camera {
  id: string;
  /** Short display name, e.g. "Ski area entrance". */
  label: string;
  /** Upstream location string, e.g. "SR-431 @ Mt Rose Ski Area". */
  location: string;
  /** Still image, refreshed upstream about once a minute. */
  imageUrl: string;
  /** HLS live stream, when the upstream offers one. */
  videoUrl: string | null;
  lat: number | null;
  lon: number | null;
}
