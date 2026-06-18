import { useState, useEffect } from 'react';
import { Resort } from './ResortGrid';
import { useResortWeather } from '../services/weatherStore';
import { snowQuality } from '../services/conditions';
import {
  hasDirectAPISupport,
  resortAPIService,
  type ResortSnowReport,
} from '../services/resortAPIs';

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
  const [report, setReport] = useState<ResortSnowReport | null>(null);

  // Direct resort report (lift status, trail counts) — independent of weather.
  useEffect(() => {
    let cancelled = false;
    if (!hasDirectAPISupport(resort.name)) {
      setReport(null);
      return;
    }
    resortAPIService
      .getResortData(resort.name)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        console.error(`Error fetching resort report for ${resort.name}:`, err);
        if (!cancelled) setReport(null);
      });
    return () => {
      cancelled = true;
    };
  }, [resort.name]);

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
            {weatherData.temp_c}
            <span className="deg">°C</span>
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
            {weatherData.freshsnow_cm}
            <span className="u">cm</span>
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
          <span className="metric">{Math.round(weatherData.base_depth)} cm</span>
          <span className="imp">{cmToIn(weatherData.base_depth)}"</span>
        </div>
        <div className="drow">
          <span className="k">Summit Depth</span>
          <span className="metric">{Math.round(weatherData.upper_depth)} cm</span>
          <span className="imp">{cmToIn(weatherData.upper_depth)}"</span>
        </div>
        <div className="drow">
          <span className="k">7-Day Total</span>
          <span className="metric">{Math.round(totalWeekSnow)} cm</span>
          <span className="imp">{cmToIn(totalWeekSnow)}"</span>
        </div>
      </div>

      {/* 7-DAY HISTOGRAM */}
      <div className="hist">
        <div className="hist-head">
          <span className="label">7-Day Snowfall</span>
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
          5-Day Forecast
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

      {/* FOOTER — lift/trail telemetry */}
      <div className="card-foot">
        <div className="telemetry">
          <div
            className="tele"
            title={report ? `Lift data via ${report.source}` : undefined}
          >
            <span className="k">Lifts</span>
            <span className="v">
              {report ? `${report.liftsOpen}/${report.liftsTotal}` : '—'}
            </span>
          </div>
          <div className="tele">
            <span className="k">Trails</span>
            <span className="v">
              {report && report.trailsTotal > 0
                ? `${report.trailsOpen}/${report.trailsTotal}`
                : '—'}
            </span>
          </div>
          <div className="tele">
            <span className="k">Wind</span>
            <span className="v">{weatherData.wind_speed_mph} mph</span>
          </div>
        </div>
        <span className="ts">UPD {nowHHMM()}</span>
      </div>
    </article>
  );
}
