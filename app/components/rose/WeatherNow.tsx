import type { WeatherData } from '../../services/apiClient';
import { cToF, mToFt } from '../../config/mtrose';
import { SourceTip } from '../SourceTip';
import { COND_ICON, COND_LABEL, fmt, hourLabel, windChillC } from './util';

export function WeatherNow({ weather }: { weather: WeatherData | null }) {
  if (!weather) {
    return (
      <section className="rose-panel">
        <header className="rose-panel-head"><h2>Weather now</h2><span className="rose-src">Open-Meteo</span></header>
        <div className="skel" style={{ height: 120 }} />
      </section>
    );
  }
  const cond = weather.forecast[0]?.condition ?? 'cloudy';
  const chill = windChillC(weather.temp_c, weather.wind_speed_mph);
  const hours = weather.hourly.slice(0, 12);
  const maxSnow = Math.max(0.5, ...hours.map((h) => h.snow_cm));

  return (
    <section className="rose-panel">
      <header className="rose-panel-head">
        <h2>Weather now</h2>
        <span className="rose-src">Open-Meteo · summit grid cell</span>
      </header>

      <div className="wx-now">
        <div className="wx-cond">
          <span className="wx-icon" aria-hidden="true">{COND_ICON[cond]}</span>
          <div>
            <div className="wx-cond-label">{COND_LABEL[cond]}</div>
            <div className="wx-cond-sub">
              {weather.forecast[0] ? `High ${weather.forecast[0].temp_high_c}° · Low ${weather.forecast[0].temp_low_c}°` : ''}
            </div>
          </div>
        </div>
        <dl className="wx-stats">
          <div>
            <dt>Temp</dt>
            <dd><SourceTip source="Open-Meteo" detail="Current air temperature">{weather.temp_c}°C</SourceTip><small>{cToF(weather.temp_c)}°F</small></dd>
          </div>
          <div>
            <dt>Feels like</dt>
            <dd>{chill}°C<small>{cToF(chill)}°F</small></dd>
          </div>
          <div>
            <dt>Wind</dt>
            <dd><SourceTip source="Open-Meteo" detail="10 m wind speed and gusts">{weather.wind_speed_mph}<small>mph</small></SourceTip></dd>
          </div>
          <div>
            <dt>Gusts</dt>
            <dd className={weather.wind_gust_mph >= 45 ? 'is-danger' : weather.wind_gust_mph >= 30 ? 'is-warn' : ''}>{weather.wind_gust_mph}<small>mph</small></dd>
          </div>
          <div>
            <dt>Freezing level</dt>
            <dd>{weather.freezing_level_m == null ? '—' : fmt(mToFt(weather.freezing_level_m))}<small>ft</small></dd>
          </div>
        </dl>
      </div>

      <div className="hourly" role="table" aria-label="Next 12 hours">
        {hours.map((h, i) => (
          <div className={`hr${i === 0 ? ' now' : ''}`} key={h.time} role="row">
            <span className="hr-t">{i === 0 ? 'Now' : hourLabel(h.time)}</span>
            <span className="hr-temp">{Math.round(h.temp_c)}°</span>
            <span className="hr-bar" aria-hidden="true">
              <span style={{ height: `${h.snow_cm > 0 ? Math.max(8, (h.snow_cm / maxSnow) * 100) : 0}%` }} />
            </span>
            <span className={`hr-snow${h.snow_cm > 0.1 ? '' : ' zero'}`}>{h.snow_cm > 0.1 ? `${h.snow_cm}` : '·'}</span>
            <span className="hr-wind">{h.wind_mph}</span>
          </div>
        ))}
        <div className="hr-legend" aria-hidden="true">
          <span>hour</span><span>temp</span><span /><span>snow cm</span><span>wind</span>
        </div>
      </div>
    </section>
  );
}
