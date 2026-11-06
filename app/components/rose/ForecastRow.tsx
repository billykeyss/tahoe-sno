import type { WeatherData } from '../../services/apiClient';
import { SourceTip } from '../SourceTip';
import { COND_ICON, isToday, weekday } from './util';

export function ForecastRow({ weather }: { weather: WeatherData | null }) {
  return (
    <section className="rose-panel">
      <header className="rose-panel-head">
        <h2>Five-day outlook</h2>
        <span className="rose-src">Open-Meteo</span>
      </header>
      {!weather ? (
        <div className="skel" style={{ height: 110 }} />
      ) : (
        <div className="fc5">
          {weather.forecast.map((d) => {
            const today = isToday(d.date);
            return (
              <div className={`fc5-day${today ? ' today' : ''}`} key={d.date}>
                <span className="fc5-name">{today ? 'Today' : weekday(d.date)}</span>
                <span className="fc5-icon" aria-hidden="true">{COND_ICON[d.condition]}</span>
                <span className={`fc5-snow${d.freshsnow_cm > 0 ? '' : ' zero'}`}>
                  <SourceTip source="Open-Meteo" detail="Forecast snowfall for the day">
                    {d.freshsnow_cm > 0 ? `${d.freshsnow_cm} cm` : 'no snow'}
                  </SourceTip>
                </span>
                <span className="fc5-temp">{d.temp_high_c}° <small>/ {d.temp_low_c}°</small></span>
                <span className={`fc5-wind${d.gust_mph >= 45 ? ' is-danger' : d.gust_mph >= 30 ? ' is-warn' : ''}`}>
                  {d.wind_speed_mph} <small>g{d.gust_mph} mph</small>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
