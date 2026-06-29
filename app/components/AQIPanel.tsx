import type { Sourced, AQIReading } from '../services/stationData';

const CAT_CLASS: Record<AQIReading['category'], string> = {
  'Good': 'aqi-cat-good',
  'Moderate': 'aqi-cat-moderate',
  'Unhealthy for Sensitive Groups': 'aqi-cat-sensitive',
  'Unhealthy': 'aqi-cat-unhealthy',
  'Very Unhealthy': 'aqi-cat-very',
  'Hazardous': 'aqi-cat-hazardous',
};

export function AQIPanel({ aqi }: { aqi: Sourced<AQIReading | null> | null }) {
  if (!aqi || !aqi.data) return null;
  const { pm25, category, stationName } = aqi.data;
  const catClass = CAT_CLASS[category];

  return (
    <div className="alert-banner">
      <span className="alert-tag">AQI</span>
      <div className="alert-list">
        <div className="aqi-reading">
          <span className="aqi-value">{pm25.toFixed(1)}</span>
          <span className={`aqi-category ${catClass}`}>{category}</span>
        </div>
        <div className="aqi-station">PM2.5 · {stationName} · OpenAQ</div>
      </div>
    </div>
  );
}
