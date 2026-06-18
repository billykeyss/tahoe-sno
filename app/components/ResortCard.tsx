import { Resort } from './ResortGrid';
import { useResortWeather } from '../services/weatherStore';
import { useSnowpack } from '../services/stationData';
import { snowQuality } from '../services/conditions';
import { SourceTip } from './SourceTip';

interface ResortCardProps {
  resort: Resort;
}

const WEATHER_ICONS = {
  sunny: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  snow: '❄️',
  rain: '🌧️',
} as const;

const CONDITION_LABELS = {
  sunny: 'SUNNY',
  'partly-cloudy': 'P-CLOUDY',
  cloudy: 'CLOUDY',
  snow: 'SNOW',
  rain: 'RAIN',
} as const;

type Condition = keyof typeof WEATHER_ICONS;

const cmToIn = (cm: number) => Math.round(cm * 0.393701);
const cToF = (c: number) => Math.round((c * 9) / 5 + 32);

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const nowHHMM = () =>
  new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

export function ResortCard({ resort }: ResortCardProps) {
  const { data: weatherData, loading, error } = useResortWeather(resort.id);
  const { snowpack } = useSnowpack(resort.id);

  const summitReadout = () => {
    const { summit } = resort.elevation;
    if (resort.country === 'canada') {
      return `${Math.round(summit * 0.3048).toLocaleString()} m`;
    }
    return `${summit.toLocaleString()} ft`;
  };

  const cardRule = (
    <div className="card-rule">
      {Array.from({ length: 10 }).map((_, i) => (
        <span className="tick" key={i} />
      ))}
      <span className="ridx">
        {resort.coordinates.lat.toFixed(2)}°N / {summitReadout()}
      </span>
    </div>
  );

  if (loading || (!weatherData && !error)) {
    return (
      <article className="card" aria-busy="true">
        {cardRule}
        <div style={{ padding: '16px 18px' }}>
          <div className="skel" style={{ height: 22, width: '60%' }} />
          <div
            className="skel"
            style={{ height: 12, width: '40%', marginTop: 8 }}
          />
        </div>
        <div
          className="skel"
          style={{ height: 70, margin: '0 18px 14px', borderRadius: 4 }}
        />
        <div
          className="skel"
          style={{ height: 96, margin: '0 18px 14px', borderRadius: 4 }}
        />
        <div
          className="skel"
          style={{ height: 64, margin: '0 18px 18px', borderRadius: 4 }}
        />
      </article>
    );
  }

  if (error || !weatherData) {
    return (
      <article className="card is-error">
        {cardRule}
        <div className="card-head">
          <div className="card-name">{resort.name}</div>
        </div>
        <div className="card-msg">
          <span>SIGNAL LOST — {error || 'no data'}</span>
        </div>
      </article>
    );
  }

  const condition: Condition = weatherData.forecast[0]?.condition || 'cloudy';
  const totalWeekSnow = weatherData.historical_snow.reduce(
    (sum, day) => sum + day.snow_cm,
    0
  );
  const maxHist = Math.max(...weatherData.historical_snow.map((d) => d.snow_cm), 1);
  const quality = snowQuality(weatherData.freshsnow_cm);
  const today = new Date();

  return (
    <article className="card">
      {cardRule}

      {/* HEAD — name + region + temp readout */}
      <div className="card-head">
        <div>
          <div className="card-name">{resort.name}</div>
          <div className="card-meta">
            <span className="region-tag">{resort.region}</span>
            <span className="open-flag">
              <span className="dot" />
              Open
            </span>
          </div>
        </div>
        <div className="temp">
          <div className="big">
            <SourceTip
              source="Open-Meteo"
              detail="Current air temperature & conditions"
            >
              {weatherData.temp_c}
              <span className="deg">°C</span>
            </SourceTip>
          </div>
          <div className="sub">
            {cToF(weatherData.temp_c)}°F · {CONDITION_LABELS[condition]}
          </div>
        </div>
      </div>

      {/* PRIMARY METRIC — 24h fresh */}
      <div className="fresh">
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            24-Hour Fresh
          </div>
          <div className="big">
            <SourceTip
              source="Open-Meteo"
              detail="New snowfall in the last 24 hours (forecast model)"
            >
              {weatherData.freshsnow_cm}
              <span className="u">cm</span>
            </SourceTip>
          </div>
        </div>
        <div className="right">
          <div className="imperial">
            {(weatherData.freshsnow_cm * 0.393701).toFixed(1)} in
          </div>
          <div
            className="label"
            style={{ marginTop: 4, color: quality.color }}
          >
            {quality.label}
          </div>
        </div>
      </div>

      {/* DEPTH TABLE */}
      <div className="dtable">
        <div className="drow">
          <span className="k">Base Depth</span>
          <SourceTip source="Open-Meteo" detail="Modeled snow depth at base elevation">
            <span className="metric">{Math.round(weatherData.base_depth)} cm</span>
          </SourceTip>
          <span className="imp">{cmToIn(weatherData.base_depth)}"</span>
        </div>
        <div className="drow">
          <span className="k">Summit Depth</span>
          <SourceTip source="Open-Meteo" detail="Modeled snow depth at summit elevation">
            <span className="metric">{Math.round(weatherData.upper_depth)} cm</span>
          </SourceTip>
          <span className="imp">{cmToIn(weatherData.upper_depth)}"</span>
        </div>
        <div className="drow">
          <span className="k">7-Day Total</span>
          <SourceTip source="Open-Meteo" detail="Total snowfall over the last 7 days">
            <span className="metric">{Math.round(totalWeekSnow)} cm</span>
          </SourceTip>
          <span className="imp">{cmToIn(totalWeekSnow)}"</span>
        </div>

        {/* Measured snowpack from the nearest CDEC sensor, shown alongside the
            Open-Meteo model rows above. Only when a station is mapped. */}
        {snowpack && (
          <>
            <div className="drow cdec">
              <span className="k">Snowpack · CDEC</span>
              <SourceTip
                source="CDEC"
                detail={`Measured snow depth at ${snowpack.data.stationName} (${snowpack.data.elevationFt} ft)`}
              >
                <span className="metric">
                  {snowpack.data.depth_cm != null
                    ? `${Math.round(snowpack.data.depth_cm)} cm`
                    : '—'}
                </span>
              </SourceTip>
              <span className="imp">
                {snowpack.data.depth_cm != null
                  ? `${cmToIn(snowpack.data.depth_cm)}"`
                  : ''}
              </span>
            </div>
            <div className="drow cdec">
              <span className="k">SWE · CDEC</span>
              <SourceTip
                source="CDEC"
                detail={`Snow-water-equivalent at ${snowpack.data.stationName}`}
              >
                <span className="metric">
                  {snowpack.data.swe_cm != null
                    ? `${Math.round(snowpack.data.swe_cm)} cm`
                    : '—'}
                </span>
              </SourceTip>
              <span className="imp">
                {snowpack.data.swe_cm != null
                  ? `${cmToIn(snowpack.data.swe_cm)}"`
                  : ''}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 7-DAY HISTOGRAM */}
      <div className="hist">
        <div className="hist-head">
          <SourceTip source="Open-Meteo" detail="Daily snowfall over the last 7 days">
            <span className="label">7-Day Snowfall</span>
          </SourceTip>
          <span className="label">{Math.round(totalWeekSnow)} cm total</span>
        </div>
        <div className="hist-bars">
          {weatherData.historical_snow.map((day) => {
            const pct = Math.round((day.snow_cm / maxHist) * 100);
            const dry = day.snow_cm <= 2;
            return (
              <div className={`hbar${dry ? ' dry' : ''}`} key={day.date}>
                <span
                  className="b"
                  style={{ height: `${Math.max(pct, 3)}%` }}
                />
                <span className="d">
                  {new Date(day.date)
                    .toLocaleDateString('en-US', { weekday: 'short' })
                    .charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-DAY FORECAST */}
      <div className="fc">
        <div className="label" style={{ marginBottom: 7 }}>
          <SourceTip
            source="Open-Meteo"
            detail="5-day temperature & snowfall forecast"
          >
            5-Day Forecast
          </SourceTip>
        </div>
        <div className="fc-grid">
          {weatherData.forecast.map((day) => {
            const d = new Date(day.date);
            const todayCell = isSameDay(d, today);
            return (
              <div
                className={`fc-cell${todayCell ? ' today' : ''}`}
                key={day.date}
              >
                <div className="day">
                  {todayCell
                    ? 'Today'
                    : d.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="ic">{WEATHER_ICONS[day.condition]}</div>
                <div className="t">
                  {Math.round(day.temp_high_c)}°/{Math.round(day.temp_low_c)}°
                </div>
                <div className={`sn${day.freshsnow_cm > 0 ? '' : ' zero'}`}>
                  {day.freshsnow_cm > 0 ? `${day.freshsnow_cm}cm` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER — wind + reading timestamp (snowpack now lives in the table) */}
      <div className="card-foot">
        <div className="telemetry">
          <div className="tele">
            <span className="k">Wind</span>
            <SourceTip source="Open-Meteo" detail="Wind speed (model estimate)">
              <span className="v">{weatherData.wind_speed_mph} mph</span>
            </SourceTip>
          </div>
        </div>
        <span className="ts">
          {weatherData.source ? `${weatherData.source.toUpperCase()} · ` : ''}UPD{' '}
          {nowHHMM()}
        </span>
      </div>
    </article>
  );
}
