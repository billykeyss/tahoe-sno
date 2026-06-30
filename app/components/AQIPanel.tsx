import type { Sourced, AQIReading } from '../services/stationData';

const CAT_COLOR: Record<AQIReading['category'], string> = {
  'Good':                            'var(--good)',
  'Moderate':                        'var(--warn)',
  'Unhealthy for Sensitive Groups':  'var(--warn)',
  'Unhealthy':                       'var(--danger)',
  'Very Unhealthy':                  'var(--danger)',
  'Hazardous':                       'var(--danger)',
};

const CAT_SHORT: Record<AQIReading['category'], string> = {
  'Good':                            'Good',
  'Moderate':                        'Moderate',
  'Unhealthy for Sensitive Groups':  'Sensitive Groups',
  'Unhealthy':                       'Unhealthy',
  'Very Unhealthy':                  'Very Unhealthy',
  'Hazardous':                       'Hazardous',
};

export function AQIPanel({ aqi }: { aqi: Sourced<AQIReading | null> | null }) {
  if (!aqi?.data) return null;
  const { pm25, category, stationName } = aqi.data;
  const color = CAT_COLOR[category];

  return (
    <div className="reno-panel" style={{ '--panel-accent': color } as React.CSSProperties}>
      <div className="reno-panel-head">
        <span className="reno-panel-tag">AIR QUALITY</span>
        <span className="reno-panel-src">AirNow · {stationName}</span>
      </div>
      <div className="aqi-body">
        <span className="aqi-num" style={{ color }}>{Math.round(pm25)}</span>
        <div className="aqi-meta">
          <span className="aqi-cat" style={{ color }}>{CAT_SHORT[category]}</span>
          <span className="aqi-unit">PM2.5 AQI</span>
        </div>
      </div>
    </div>
  );
}
