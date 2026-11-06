import type { WeatherData } from '../../services/apiClient';
import type { Snowpack } from '../../services/stationData';
import type { Sourced } from '../../services/stationData';
import { cmToIn } from '../../config/mtrose';
import { SourceTip } from '../SourceTip';
import { fmt, weekday } from './util';

function Spark({ series }: { series: Array<{ date: string; depth_cm: number | null }> }) {
  const pts = series.filter((d) => d.depth_cm != null) as Array<{ date: string; depth_cm: number }>;
  if (pts.length < 2) return null;
  const W = 320, H = 72, P = 4;
  const max = Math.max(10, ...pts.map((p) => p.depth_cm));
  const x = (i: number) => P + (i / (pts.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.depth_cm).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  const last = pts[pts.length - 1];
  return (
    <figure className="spark" aria-label={`Snow depth over the last ${pts.length} days`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={area} className="spark-area" />
        <path d={line} className="spark-line" />
        <circle cx={x(pts.length - 1)} cy={y(last.depth_cm)} r="3" className="spark-dot" />
      </svg>
      <figcaption>
        <span>{weekday(pts[0].date, { month: 'short', day: 'numeric' })}</span>
        <span>peak {Math.round(max)} cm</span>
        <span>{weekday(last.date, { month: 'short', day: 'numeric' })}</span>
      </figcaption>
    </figure>
  );
}

function delta(series: Snowpack['history'], days: number): number | null {
  if (!series || series.length < days + 1) return null;
  const a = series[series.length - 1 - days]?.depth_cm;
  const b = series[series.length - 1]?.depth_cm;
  return a == null || b == null ? null : Math.round(b - a);
}

const signed = (n: number | null) => (n == null ? '—' : `${n > 0 ? '+' : ''}${n} cm`);

export function BasePanel({ snowpack, weather, densityPct }: { snowpack: Sourced<Snowpack> | null; weather: WeatherData | null; densityPct: number | null }) {
  const s = snowpack?.data ?? null;
  const depth = s?.depth_cm ?? null;
  const source = snowpack?.source ?? 'SNOTEL';

  return (
    <section className="rose-panel">
      <header className="rose-panel-head">
        <h2>Base conditions</h2>
        <span className="rose-src">{snowpack ? `${snowpack.source} · ${s?.stationName}` : 'Sensor offline'}</span>
      </header>

      <div className="base-top">
        <div className="base-depth">
          <span className="base-k">Snow depth at {s ? fmt(s.elevationFt) : '8,810'} ft</span>
          <span className="base-v">
            {depth != null && s ? (
              <SourceTip source={source} detail={`Measured daily snow depth at ${s.stationName}, inside the ski-area boundary`}>
                {Math.round(depth)}<span className="ro-u"> cm</span>
              </SourceTip>
            ) : '—'}
          </span>
          <span className="base-s">{depth != null ? `${cmToIn(depth)} in · measured` : 'no reading'}</span>
        </div>
        <dl className="base-stats">
          <div><dt>24h change</dt><dd>{signed(delta(s?.history, 1))}</dd></div>
          <div><dt>7-day change</dt><dd>{signed(delta(s?.history, 7))}</dd></div>
          <div>
            <dt>Water content</dt>
            <dd>{s?.swe_cm != null ? <SourceTip source={source} detail="Snow-water-equivalent: how much water the snowpack holds">{s.swe_cm} cm</SourceTip> : '—'}</dd>
          </div>
          <div>
            <dt>New-snow density</dt>
            <dd>{densityPct != null ? `${densityPct}%` : '—'}</dd>
          </div>
        </dl>
      </div>

      {s?.history && <Spark series={s.history} />}

      <div className="base-model">
        <span className="base-model-k">Model, for comparison</span>
        <span>
          <SourceTip source="Open-Meteo" detail="Modeled snow depth at the base grid cell">base {weather ? Math.round(weather.base_depth) : '—'} cm</SourceTip>
          {' · '}
          <SourceTip source="Open-Meteo" detail="Modeled snow depth, scaled for the summit">summit {weather ? Math.round(weather.upper_depth) : '—'} cm</SourceTip>
        </span>
      </div>
    </section>
  );
}
