import type { ReactNode } from 'react';
import { MT_ROSE, cToF, cmToIn } from '../../config/mtrose';
import type { WeatherData } from '../../services/apiClient';
import type { Incident, Snowpack, WeatherAlert } from '../../services/stationData';
import type { PowderAnalysis } from '../../services/powder';
import { HeroHeadline } from '../HeroHeadline';
import { SourceTip } from '../SourceTip';
import { ElevationGauge } from './ElevationGauge';
import { fmt, onMtRoseHighway, worstAlert, worstSeverity } from './util';

interface Props {
  weather: WeatherData | null;
  snowpack: Snowpack | null;
  powder: PowderAnalysis | null;
  incidents: Incident[] | null;
  alerts: WeatherAlert[] | null;
  loading: boolean;
}

type Tone = 'ok' | 'warn' | 'danger' | 'muted';

function Signal({ label, value, tone, source, detail }: { label: string; value: ReactNode; tone: Tone; source: string; detail: string }) {
  return (
    <div className={`signal is-${tone}`}>
      <span className="signal-label">{label}</span>
      <SourceTip source={source} detail={detail}>
        <span className="signal-value">{value}</span>
      </SourceTip>
    </div>
  );
}

function lede(w: WeatherData, p: PowderAnalysis, snow: Snowpack | null, hwyClear: boolean): string {
  const parts: string[] = [];
  if (p.storm48_cm > 0) parts.push(`${p.storm48_cm} cm fell in the last two days`);
  else if (p.incoming_cm > 0 && p.bestDay) parts.push(`${p.incoming_cm} cm is on the way this week`);
  else parts.push('No new snow and none in the five-day outlook');
  if (snow?.depth_cm != null) parts.push(`${Math.round(snow.depth_cm)} cm on the ground at the sensor`);
  parts.push(w.wind_gust_mph >= 45 ? 'gusts strong enough to hold the upper lifts' : `wind ${w.wind_speed_mph} mph`);
  parts.push(hwyClear ? 'highway clear' : 'something on the highway');
  const s = parts.join(', ');
  return s.charAt(0).toUpperCase() + s.slice(1) + '.';
}

export function RoseHero({ weather, snowpack, powder, incidents, alerts, loading }: Props) {
  const hwy = (incidents ?? []).filter(onMtRoseHighway);
  const hwySev = worstSeverity(hwy);
  const alert = alerts ? worstAlert(alerts) : null;
  const gust = weather?.wind_gust_mph ?? 0;
  const level = powder?.snowLevelFt ?? null;

  const hwyTone: Tone = !incidents ? 'muted' : !hwySev ? 'ok' : hwySev === 'Low' ? 'warn' : 'danger';
  const windTone: Tone = !weather ? 'muted' : gust >= 45 ? 'danger' : gust >= 30 ? 'warn' : 'ok';
  const alertTone: Tone = !alerts ? 'muted' : !alert ? 'ok' : alert.severity === 'Severe' || alert.severity === 'Extreme' ? 'danger' : 'warn';
  const levelTone: Tone = level == null ? 'muted' : level <= MT_ROSE.elevation.base ? 'ok' : level <= MT_ROSE.elevation.summit ? 'warn' : 'danger';

  return (
    <section className="rose-hero">
      <div className="rose-hero-main">
        <div className="rose-eyebrow">
          {MT_ROSE.fullName} · Nevada · base {fmt(MT_ROSE.elevation.base)} ft, highest in Tahoe
        </div>
        <HeroHeadline place={MT_ROSE.name} max24h={powder?.storm48_cm ?? 0} />
        <p className="rose-lede">
          {weather && powder
            ? lede(weather, powder, snowpack, !hwySev)
            : loading
            ? 'Reading the mountain…'
            : 'Weather feed is down. Signals below still update independently.'}
        </p>

        <div className="rose-signals">
          <Signal
            label={`Hwy 431`}
            tone={hwyTone}
            source="NV511"
            detail="Active NV511 incidents, closures and construction on the Mt Rose Highway"
            value={!incidents ? '…' : !hwySev ? 'Clear' : hwy.length === 1 ? hwy[0].type : `${hwy.length} incidents`}
          />
          <Signal
            label="Wind"
            tone={windTone}
            source="Open-Meteo"
            detail="Model wind at the summit grid cell. Mt Rose's upper chairs tend to hold above ~45 mph gusts."
            value={weather ? `${weather.wind_speed_mph} g${gust}` : '…'}
          />
          <Signal
            label="Alerts"
            tone={alertTone}
            source="NWS"
            detail="Active National Weather Service alerts for the Mt Rose point"
            value={!alerts ? '…' : alert ? alert.event : 'None'}
          />
          <Signal
            label="Snow level"
            tone={levelTone}
            source="Open-Meteo"
            detail="Estimated from the model freezing level (snow level ≈ 1,000 ft below it). Below 8,260 ft means snow at the lodge."
            value={level == null ? '—' : `${fmt(level)} ft`}
          />
        </div>
      </div>

      <div className="rose-hero-side">
        <ElevationGauge snowLevelFt={level} snotelDepthCm={snowpack?.depth_cm ?? null} />

        <div className="rose-readout">
          <div className="ro-row">
            <span className="ro-k">New snow, 48h</span>
            <span className="ro-v snow">
              <SourceTip source="Open-Meteo" detail="Yesterday's plus today's modeled snowfall at the summit grid cell">
                {powder ? powder.storm48_cm : '—'}<span className="ro-u"> cm</span>
              </SourceTip>
            </span>
            <span className="ro-s">{powder ? `${cmToIn(powder.storm48_cm)} in` : ''}</span>
          </div>
          <div className="ro-row">
            <span className="ro-k">On the ground</span>
            <span className="ro-v">
              {snowpack?.depth_cm != null ? (
                <SourceTip source="SNOTEL" detail={`Measured snow depth at ${snowpack.stationName} (${fmt(snowpack.elevationFt)} ft)`}>
                  {Math.round(snowpack.depth_cm)}<span className="ro-u"> cm</span>
                </SourceTip>
              ) : weather ? (
                <SourceTip source="Open-Meteo" detail="Modeled snow depth (no sensor reading)">
                  {Math.round(weather.base_depth)}<span className="ro-u"> cm</span>
                </SourceTip>
              ) : '—'}
            </span>
            <span className="ro-s">{snowpack?.depth_cm != null ? `${cmToIn(snowpack.depth_cm)} in, measured` : weather ? 'modeled' : ''}</span>
          </div>
          <div className="ro-row">
            <span className="ro-k">Temperature</span>
            <span className="ro-v">
              {weather ? (
                <SourceTip source="Open-Meteo" detail="Current air temperature at the summit grid cell">
                  {weather.temp_c}<span className="ro-u">°C</span>
                </SourceTip>
              ) : '—'}
            </span>
            <span className="ro-s">{weather ? `${cToF(weather.temp_c)}°F` : ''}</span>
          </div>
          <div className="ro-row">
            <span className="ro-k">Next 5 days</span>
            <span className={`ro-v ${powder && powder.incoming_cm > 0 ? 'snow' : ''}`}>
              {powder ? powder.incoming_cm : '—'}<span className="ro-u"> cm</span>
            </span>
            <span className="ro-s">{powder?.bestDay ? `best ${new Date(powder.bestDay.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' })}` : powder ? 'nothing coming' : ''}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
