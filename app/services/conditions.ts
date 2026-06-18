// Pure "overall conditions score" used to rank the best areas to ski.
// Snow dominates the score; a small elevation term keeps the ranking sensible
// off-season (when every resort reports 0 snow) by favoring higher summits.
import type { WeatherData } from './apiClient';

export function scoreConditions(
  data: WeatherData,
  summitElevation: number
): number {
  const week = data.historical_snow.reduce((sum, d) => sum + d.snow_cm, 0);
  const snow = data.freshsnow_cm * 4 + week * 1 + data.base_depth * 0.25;
  const elev = Math.max(0, Math.min(1, (summitElevation - 5000) / 6000)) * 8;
  return Math.round(Math.max(0, Math.min(100, snow + elev)));
}

// Snow-quality label + the CSS token used to color it (shared by the card and
// the "best conditions" section so they never disagree).
export function snowQuality(freshSnow: number): { label: string; color: string } {
  if (freshSnow >= 20) return { label: 'Excellent', color: 'var(--good)' };
  if (freshSnow >= 10) return { label: 'Good', color: 'var(--snow-deep)' };
  if (freshSnow >= 5) return { label: 'Fair', color: 'var(--warn)' };
  return { label: 'Lean', color: 'var(--ink-3)' };
}

export interface ScoredResort<T> {
  resort: T;
  data: WeatherData;
  score: number;
}

export function rankByConditions<T extends { elevation: { summit: number } }>(
  items: Array<{ resort: T; data: WeatherData }>,
  limit: number
): Array<ScoredResort<T>> {
  return items
    .map(({ resort, data }) => ({
      resort,
      data,
      score: scoreConditions(data, resort.elevation.summit),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
