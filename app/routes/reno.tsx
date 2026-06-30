import { AlertBanner } from '../components/AlertBanner';
import { FirePanel } from '../components/FirePanel';
import { AQIPanel } from '../components/AQIPanel';
import { IncidentsPanel } from '../components/IncidentsPanel';
import { RenoMap } from '../components/RenoMap';
import { useFires, useAQI, useIncidents, useAlerts } from '../services/stationData';

const RENO = { lat: 39.5296, lon: -119.8138 };

const AQI_COLOR: Record<string, string> = {
  'Good': 'var(--good)',
  'Moderate': 'var(--warn)',
  'Unhealthy for Sensitive Groups': 'var(--warn)',
  'Unhealthy': 'var(--danger)',
  'Very Unhealthy': 'var(--danger)',
  'Hazardous': 'var(--danger)',
};

export default function RenoPage() {
  const fires = useFires();
  const aqi = useAQI();
  const incidents = useIncidents();
  const alerts = useAlerts(RENO.lat, RENO.lon);

  const fireCount = fires.data?.data.length ?? 0;
  const alertCount = alerts.data?.data.length ?? 0;
  const incidentCount = incidents.data?.data.length ?? 0;
  const aqiData = aqi.data?.data ?? null;

  return (
    <main className="wrap">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="reno-header">
        <div className="reno-title">
          <span className="reno-eyebrow">WASHOE COUNTY · NEVADA</span>
          <h1 className="reno-h1">Reno <span className="reno-sep">/</span> Sparks</h1>
          <p className="reno-sub">Real-time safety intelligence — fires, air, roads, alerts</p>
        </div>

        {/* Status chips */}
        <div className="reno-chips">
          <div className={`reno-chip ${fireCount ? 'chip-fire' : ''}`}>
            <span className="chip-label">FIRES</span>
            <span className="chip-val">{fireCount || '—'}</span>
          </div>
          <div className={`reno-chip ${alertCount ? 'chip-alert' : ''}`}>
            <span className="chip-label">ALERTS</span>
            <span className="chip-val">{alertCount || '—'}</span>
          </div>
          <div className="reno-chip" style={aqiData ? { '--chip-accent': AQI_COLOR[aqiData.category] } as React.CSSProperties : {}}>
            <span className="chip-label">AQI</span>
            <span className="chip-val chip-aqi" style={aqiData ? { color: AQI_COLOR[aqiData.category] } : {}}>
              {aqiData ? aqiData.pm25 : '—'}
            </span>
          </div>
          <div className="reno-chip">
            <span className="chip-label">ROADS</span>
            <span className="chip-val">{incidentCount || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── Map (full width, top) ───────────────────────────── */}
      <RenoMap fires={fires.data} incidents={incidents.data} />

      {/* ── Alert panels ───────────────────────────────────── */}
      <div className="reno-panels">
        <FirePanel fires={fires.data} />
        <AlertBanner alerts={alerts.data} />
        <AQIPanel aqi={aqi.data} />
        <IncidentsPanel incidents={incidents.data} />
      </div>

      <footer className="foot">
        <span>FIRES NIFC · ALERTS NWS · AIR AIRNOW · ROADS NV511</span>
        <span>39.5°N 119.8°W · 2026</span>
      </footer>
    </main>
  );
}
