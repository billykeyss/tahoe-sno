import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient, type WeatherData } from './apiClient';
import resortsConfig from '../config/resorts.json';
import type { Resort } from '../components/ResortGrid';

export interface WeatherEntry {
  data?: WeatherData;
  loading: boolean;
  error?: string;
}

interface WeatherStoreValue {
  resorts: Resort[];
  entries: Record<string, WeatherEntry>;
}

const WeatherContext = createContext<WeatherStoreValue | null>(null);

/** Active resorts for a country (shared filter, also used by ResortGrid). */
export function getCountryResorts(country: string): Resort[] {
  return (resortsConfig.resorts as Resort[]).filter((r) => {
    const c = r.country || 'usa';
    return r.status === 'active' && c === country;
  });
}

const CONCURRENCY = 5;

/**
 * Fetches weather for every resort in a country once (bounded concurrency to
 * avoid rate limits) and shares it. Replaces the per-card fetch so the cards,
 * the "best conditions" ranking, and the hero readout all use one dataset.
 */
export function WeatherProvider({
  country,
  children,
}: {
  country: string;
  children: ReactNode;
}) {
  const resorts = useMemo(() => getCountryResorts(country), [country]);
  const [entries, setEntries] = useState<Record<string, WeatherEntry>>(() =>
    Object.fromEntries(resorts.map((r) => [r.id, { loading: true }]))
  );

  useEffect(() => {
    let cancelled = false;
    setEntries(Object.fromEntries(resorts.map((r) => [r.id, { loading: true }])));

    const load = async () => {
      const queue = [...resorts];
      const worker = async () => {
        while (queue.length > 0) {
          const resort = queue.shift();
          if (!resort) break;
          try {
            const data = await apiClient.getResortWeatherPrimary(
              resort.coordinates.lat,
              resort.coordinates.lon
            );
            if (!cancelled) {
              setEntries((prev) => ({
                ...prev,
                [resort.id]: { loading: false, data },
              }));
            }
          } catch (err) {
            if (!cancelled) {
              setEntries((prev) => ({
                ...prev,
                [resort.id]: {
                  loading: false,
                  error:
                    err instanceof Error ? err.message : 'Failed to load data',
                },
              }));
            }
          }
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    };

    load();
    const id = setInterval(load, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [resorts]);

  const value = useMemo(() => ({ resorts, entries }), [resorts, entries]);
  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeatherStore(): WeatherStoreValue {
  return useContext(WeatherContext) ?? { resorts: [], entries: {} };
}

export function useResortWeather(id: string): WeatherEntry {
  const ctx = useContext(WeatherContext);
  return ctx?.entries[id] ?? { loading: true };
}

/** Aggregates for the hero readout (real, derived from loaded data). */
export function useWeatherAggregates(): {
  total: number;
  reporting: number;
  max24h: number;
} {
  const { resorts, entries } = useWeatherStore();
  const loaded = resorts.filter((r) => entries[r.id]?.data);
  const max24h = loaded.reduce(
    (max, r) => Math.max(max, entries[r.id]?.data?.freshsnow_cm ?? 0),
    0
  );
  return { total: resorts.length, reporting: loaded.length, max24h };
}
