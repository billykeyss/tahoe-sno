import type { Condition } from '../../services/apiClient';
import type { Incident, WeatherAlert } from '../../services/stationData';

export const COND_ICON: Record<Condition, string> = {
  sunny: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  snow: '❄️',
  rain: '🌧️',
};

export const COND_LABEL: Record<Condition, string> = {
  sunny: 'Sunny',
  'partly-cloudy': 'Partly cloudy',
  cloudy: 'Cloudy',
  snow: 'Snowing',
  rain: 'Rain',
};

/** Is this NV511 incident on the Mt Rose Highway (SR-431)? */
export function onMtRoseHighway(inc: Incident): boolean {
  const hay = `${inc.route} ${inc.location} ${inc.description}`;
  return /\b431\b/.test(hay) || /mt\.?\s*rose/i.test(hay);
}

const SEV_RANK: Record<Incident['severity'], number> = { Low: 1, Medium: 2, High: 3, Unknown: 2 };

export function worstSeverity(list: Incident[]): Incident['severity'] | null {
  return list.reduce<Incident['severity'] | null>(
    (w, i) => (!w || SEV_RANK[i.severity] > SEV_RANK[w] ? i.severity : w),
    null
  );
}

const ALERT_RANK: Record<WeatherAlert['severity'], number> = {
  Minor: 1, Unknown: 1, Moderate: 2, Severe: 3, Extreme: 4,
};
export function worstAlert(list: WeatherAlert[]): WeatherAlert | null {
  return list.reduce<WeatherAlert | null>(
    (w, a) => (!w || ALERT_RANK[a.severity] > ALERT_RANK[w.severity] ? a : w),
    null
  );
}

/** "2026-11-05T14:00" → "2p" */
export function hourLabel(iso: string): string {
  const h = Number(iso.slice(11, 13));
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

/** "2026-11-05" → "Thu" (local date, no TZ shift). */
export function weekday(date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short' }): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
}

export function isToday(date: string): boolean {
  const t = new Date();
  const [y, m, d] = date.split('-').map(Number);
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d;
}

/** NWS wind-chill (°C in/out); returns the air temp when the formula doesn't apply. */
export function windChillC(tempC: number, mph: number): number {
  if (tempC > 10 || mph <= 3) return tempC;
  const f = (tempC * 9) / 5 + 32;
  const wc = 35.74 + 0.6215 * f - 35.75 * mph ** 0.16 + 0.4275 * f * mph ** 0.16;
  return Math.round(((wc - 32) * 5) / 9);
}

export const fmt = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
