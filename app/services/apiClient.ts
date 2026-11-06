// API client for TahoeSno.
//
// Data is fetched server-side by the Hono proxy (see /server) which calls the
// free government APIs (Open-Meteo, NWS, CDEC, Caltrans) without CORS/key
// hassles and attaches provenance. This client just calls our own same-origin
// /api/* endpoints. In dev, Vite proxies /api to the server (see vite.config).

export type Condition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'snow' | 'rain';

export interface HourlyPoint {
  time: string;
  temp_c: number;
  snow_cm: number;
  wind_mph: number;
  gust_mph: number;
  freezing_level_m: number | null;
}

export interface WeatherData {
  base_depth: number;
  upper_depth: number;
  freshsnow_cm: number;
  weather_desc: string;
  temp_c: number;
  wind_speed_mph: number;
  wind_gust_mph: number;
  freezing_level_m: number | null;
  forecast: Array<{
    date: string;
    temp_high_c: number;
    temp_low_c: number;
    freshsnow_cm: number;
    wind_speed_mph: number;
    gust_mph: number;
    condition: Condition;
  }>;
  /** Last 7 days, oldest first. */
  historical_snow: Array<{ date: string; snow_cm: number }>;
  /** Last 14 days, oldest first. */
  snow_history: Array<{ date: string; snow_cm: number }>;
  /** Next 24 hours from now. */
  hourly: HourlyPoint[];
  /** Provenance for the attribution UI (e.g. "Open-Meteo"). */
  source?: string;
}

// Shape returned by GET /api/weather (server NormalizedWeather, wrapped).
interface ServerWeather {
  temp_c: number;
  wind_speed_mph: number;
  wind_gust_mph?: number;
  freezing_level_m?: number | null;
  weather_desc: string;
  freshsnow_cm: number;
  base_depth_cm: number;
  upper_depth_cm: number;
  forecast: Array<{
    date: string;
    temp_high_c: number;
    temp_low_c: number;
    freshsnow_cm: number;
    wind_mph?: number;
    gust_mph?: number;
    condition: Condition;
  }>;
  historical_snow: Array<{ date: string; snow_cm: number }>;
  snow_history?: Array<{ date: string; snow_cm: number }>;
  hourly?: HourlyPoint[];
}

interface Sourced<T> {
  data: T;
  source: string;
  fetchedAt: string;
}

class TahoeAPIClient {
  /** Primary resort weather via the server proxy (Open-Meteo upstream). */
  async getResortWeatherPrimary(lat: number, lon: number): Promise<WeatherData> {
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    const payload = (await res.json()) as Sourced<ServerWeather>;
    const d = payload.data;

    return {
      base_depth: d.base_depth_cm,
      upper_depth: d.upper_depth_cm,
      freshsnow_cm: d.freshsnow_cm,
      weather_desc: d.weather_desc,
      temp_c: d.temp_c,
      wind_speed_mph: d.wind_speed_mph,
      wind_gust_mph: d.wind_gust_mph ?? d.wind_speed_mph,
      freezing_level_m: d.freezing_level_m ?? null,
      forecast: d.forecast.map((f) => ({
        date: f.date,
        temp_high_c: f.temp_high_c,
        temp_low_c: f.temp_low_c,
        freshsnow_cm: f.freshsnow_cm,
        wind_speed_mph: f.wind_mph ?? 0,
        gust_mph: f.gust_mph ?? 0,
        condition: f.condition,
      })),
      historical_snow: d.historical_snow,
      snow_history: d.snow_history ?? d.historical_snow,
      hourly: d.hourly ?? [],
      source: payload.source,
    };
  }
}

export const apiClient = new TahoeAPIClient();
