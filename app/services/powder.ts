// Powder analysis — a plain-arithmetic read of how good the skiing is likely to
// be at one mountain, from the data we already fetch. Every factor is explained
// so the number is never a black box. Pure; tested in tests/services/powder.spec.ts.

import type { WeatherData } from './apiClient';
import type { Snowpack } from './stationData';

export interface PowderFactor {
  key: 'fresh' | 'quality' | 'wind' | 'snowline' | 'base';
  label: string;
  /** Short reading shown next to the label, e.g. "9 cm / 48h". */
  value: string;
  /** 0–100 contribution before weighting. */
  score: number;
  weight: number;
  /** One plain sentence explaining the score. */
  note: string;
}

export interface PowderAnalysis {
  score: number; // 0–100
  verdict: string;
  factors: PowderFactor[];
  /** New snow in the last 48h (yesterday + today), cm. */
  storm48_cm: number;
  /** Snow in the last 7 days, cm. */
  week_cm: number;
  /** Forecast snow over the next 5 days, cm. */
  incoming_cm: number;
  /** Best upcoming day by forecast snowfall, or null when nothing is coming. */
  bestDay: { date: string; snow_cm: number } | null;
  /** Hours until the model shows snow falling, or null if none in 24h. */
  snowStartsInHours: number | null;
  /** Estimated snow level, ft ASL, or null without a freezing level. */
  snowLevelFt: number | null;
  /** New-snow density from measured depth/SWE, % water, or null. */
  densityPct: number | null;
}

const FT_PER_M = 3.28084;
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const r0 = Math.round;

/** Snow level is typically ~300 m (1,000 ft) below the freezing level. */
export function snowLevelFt(freezingLevelM: number | null): number | null {
  if (freezingLevelM == null) return null;
  return r0((freezingLevelM - 300) * FT_PER_M);
}

/**
 * Density of the newest snow from the SNOTEL series: ΔSWE / Δdepth over the
 * most recent day the depth went up. Returns % water (Sierra average ≈ 12%).
 */
export function newSnowDensity(history: Snowpack['history'] | undefined): number | null {
  if (!history || history.length < 2) return null;
  for (let i = history.length - 1; i > 0; i--) {
    const a = history[i - 1];
    const b = history[i];
    if (a.depth_cm == null || b.depth_cm == null || a.swe_cm == null || b.swe_cm == null) continue;
    const dDepth = b.depth_cm - a.depth_cm;
    const dSwe = b.swe_cm - a.swe_cm;
    if (dDepth >= 3 && dSwe > 0) return clamp(r0((dSwe / dDepth) * 100), 2, 40);
  }
  return null;
}

export function verdictFor(score: number): string {
  if (score >= 80) return 'Powder day';
  if (score >= 60) return 'Good turns';
  if (score >= 40) return 'Fair — groomers';
  if (score >= 20) return 'Thin cover';
  return 'Not yet';
}

export function analyzePowder(
  w: WeatherData,
  snowpack: Snowpack | null,
  elevation: { base: number; summit: number }
): PowderAnalysis {
  const hist = w.snow_history ?? w.historical_snow;
  const yesterday = hist[hist.length - 1]?.snow_cm ?? 0;
  const storm48 = r0(yesterday + w.freshsnow_cm);
  const week = r0(hist.slice(-7).reduce((s, d) => s + d.snow_cm, 0));
  const incoming = r0(w.forecast.slice(1).reduce((s, d) => s + d.freshsnow_cm, 0));

  const best = w.forecast.reduce<{ date: string; snow_cm: number } | null>((acc, d) => {
    if (d.freshsnow_cm <= 0) return acc;
    return !acc || d.freshsnow_cm > acc.snow_cm ? { date: d.date, snow_cm: d.freshsnow_cm } : acc;
  }, null);

  const startIdx = (w.hourly ?? []).findIndex((h) => h.snow_cm > 0.1);
  const snowStartsInHours = startIdx >= 0 ? startIdx : null;

  const level = snowLevelFt(w.freezing_level_m ?? null);
  const density = newSnowDensity(snowpack?.history);
  const depth = snowpack?.depth_cm ?? w.base_depth;
  const gust = w.wind_gust_mph ?? w.wind_speed_mph;

  // --- Fresh snow (40%) — 30 cm in 48h is a full-score storm.
  const freshScore = clamp((storm48 / 30) * 100);
  const fresh: PowderFactor = {
    key: 'fresh',
    label: 'New snow',
    value: `${storm48} cm / 48h`,
    score: freshScore,
    weight: 0.4,
    note:
      storm48 >= 20
        ? 'A real storm total. Expect soft snow everywhere.'
        : storm48 >= 8
        ? 'Enough to freshen the groomers and fill in tracks.'
        : storm48 > 0
        ? 'A dusting. Mostly firm underneath.'
        : 'Nothing new in the last two days.',
  };

  // --- Snow quality (20%) — density when we have it, else temperature.
  let qualityScore: number;
  let qualityValue: string;
  let qualityNote: string;
  if (density != null) {
    qualityScore = density <= 8 ? 100 : density <= 12 ? 80 : density <= 15 ? 55 : 25;
    qualityValue = `${density}% water`;
    qualityNote =
      density <= 8
        ? 'Blower. Lighter than the Sierra average.'
        : density <= 12
        ? 'Light and dry for Tahoe.'
        : density <= 15
        ? 'Typical Sierra snow — supportive, a bit heavy.'
        : 'Dense, wet snow. Heavy turns.';
  } else {
    const t = w.temp_c;
    qualityScore = t <= -8 ? 90 : t <= -3 ? 75 : t <= 0 ? 55 : t <= 4 ? 30 : 10;
    qualityValue = `${t}°C at the top`;
    qualityNote =
      t <= -3
        ? 'Cold enough to keep whatever is on the ground dry.'
        : t <= 0
        ? 'Near freezing. Surfaces soften by afternoon.'
        : 'Above freezing. Expect wet, sun-affected snow.';
  }
  const quality: PowderFactor = {
    key: 'quality',
    label: 'Snow quality',
    value: qualityValue,
    score: qualityScore,
    weight: 0.2,
    note: qualityNote,
  };

  // --- Wind (15%) — Mt Rose's upper chairs go on hold in strong gusts.
  const windScore = clamp(100 - ((gust - 15) / 35) * 100);
  const wind: PowderFactor = {
    key: 'wind',
    label: 'Wind',
    value: `${w.wind_speed_mph} mph, gusts ${gust}`,
    score: windScore,
    weight: 0.15,
    note:
      gust >= 45
        ? 'Strong gusts. Upper lifts are likely to hold.'
        : gust >= 30
        ? 'Breezy up top. Wind-affected snow on exposed faces.'
        : 'Calm enough that wind is not a factor.',
  };

  // --- Snow line vs base (10%).
  let lineScore = 60;
  let lineValue = 'No freezing-level data';
  let lineNote = 'The model gave no freezing level for this hour.';
  if (level != null) {
    const margin = elevation.base - level; // positive = snow level below the lodge
    lineScore = clamp(50 + (margin / 1500) * 50);
    lineValue = `${level.toLocaleString()} ft`;
    lineNote =
      margin >= 500
        ? 'Well below the base. Any precipitation falls as snow at the lodge.'
        : margin >= 0
        ? 'Right around the base. Snow up top, maybe mixed at the lodge.'
        : level >= elevation.summit
        ? 'Above the summit. Precipitation would be rain.'
        : 'Between base and summit. Rain low, snow high.';
  }
  const snowline: PowderFactor = {
    key: 'snowline',
    label: 'Snow level',
    value: lineValue,
    score: lineScore,
    weight: 0.1,
    note: lineNote,
  };

  // --- Base depth (15%) — 150 cm measured is full coverage.
  const baseScore = clamp((depth / 150) * 100);
  const base: PowderFactor = {
    key: 'base',
    label: 'Base depth',
    value: `${r0(depth)} cm${snowpack ? ' measured' : ' modeled'}`,
    score: baseScore,
    weight: 0.15,
    note:
      depth >= 150
        ? 'Full coverage. Everything should be open.'
        : depth >= 75
        ? 'Solid coverage on the main runs.'
        : depth >= 30
        ? 'Early-season cover. Watch for rocks off-piste.'
        : 'Thin. Groomers only, if open.',
  };

  const factors = [fresh, quality, wind, snowline, base];
  const score = r0(factors.reduce((s, f) => s + f.score * f.weight, 0));

  return {
    score,
    verdict: verdictFor(score),
    factors,
    storm48_cm: storm48,
    week_cm: week,
    incoming_cm: incoming,
    bestDay: best,
    snowStartsInHours,
    snowLevelFt: level,
    densityPct: density,
  };
}
