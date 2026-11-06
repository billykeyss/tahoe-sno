import type { WeatherData } from '../../services/apiClient';
import { cmToIn } from '../../config/mtrose';
import { SourceTip } from '../SourceTip';
import { weekday } from './util';

export function PastSnow({ weather }: { weather: WeatherData | null }) {
  if (!weather) {
    return (
      <section className="rose-panel">
        <header className="rose-panel-head"><h2>Past snow</h2></header>
        <div className="skel" style={{ height: 150 }} />
      </section>
    );
  }
  const hist = weather.snow_history;
  const sum = (n: number) => Math.round(hist.slice(-n).reduce((s, d) => s + d.snow_cm, 0));
  const totals = [
    { k: 'Yesterday', v: hist[hist.length - 1]?.snow_cm ?? 0 },
    { k: '3 days', v: sum(3) },
    { k: '7 days', v: sum(7) },
    { k: '14 days', v: sum(14) },
  ];
  const max = Math.max(1, ...hist.map((d) => d.snow_cm));

  return (
    <section className="rose-panel">
      <header className="rose-panel-head">
        <h2>Past snow</h2>
        <span className="rose-src">Open-Meteo · daily totals</span>
      </header>

      <dl className="past-totals">
        {totals.map((t) => (
          <div key={t.k}>
            <dt>{t.k}</dt>
            <dd className={t.v > 0 ? 'snow' : ''}>
              <SourceTip source="Open-Meteo" detail={`Modeled snowfall, last ${t.k.toLowerCase()}`}>{t.v}</SourceTip>
              <small>cm · {cmToIn(t.v)} in</small>
            </dd>
          </div>
        ))}
      </dl>

      <div className="past-bars" role="img" aria-label="Daily snowfall for the last 14 days">
        {hist.map((d) => (
          <div className={`pb${d.snow_cm <= 0 ? ' dry' : ''}`} key={d.date} title={`${weekday(d.date, { month: 'short', day: 'numeric' })}: ${d.snow_cm} cm`}>
            <span className="pb-v">{d.snow_cm > 0 ? d.snow_cm : ''}</span>
            <span className="pb-bar"><span style={{ height: `${Math.max(d.snow_cm > 0 ? 6 : 2, (d.snow_cm / max) * 100)}%` }} /></span>
            <span className="pb-d">{weekday(d.date).charAt(0)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
