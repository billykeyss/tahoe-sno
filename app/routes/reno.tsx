import { AlertBanner } from '../components/AlertBanner';
import { FirePanel } from '../components/FirePanel';
import { AQIPanel } from '../components/AQIPanel';
import { IncidentsPanel } from '../components/IncidentsPanel';
import { RenoMap } from '../components/RenoMap';
import { HeroHeadline } from '../components/HeroHeadline';
import { useFires, useAQI, useIncidents, useAlerts } from '../services/stationData';

const RENO = { lat: 39.5296, lon: -119.8138 };

export default function RenoPage() {
  const fires = useFires();
  const aqi = useAQI();
  const incidents = useIncidents();
  const alerts = useAlerts(RENO.lat, RENO.lon);

  const fireCount = fires.data?.data.length ?? 0;
  const alertCount = alerts.data?.data.length ?? 0;
  const incidentCount = incidents.data?.data.length ?? 0;
  const aqiCategory = aqi.data?.data?.category ?? null;

  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <HeroHeadline place="Reno · Sparks" />
          <p>
            Real-time fire activity, emergency alerts, air quality, and road
            incidents for Reno, Sparks, and Washoe County.
          </p>
        </div>
        <div className="readout">
          <div className="readout-row">
            <span className="label">Active fires</span>
            <span className={`v ${fireCount ? 'acc' : ''}`}>{fireCount}</span>
          </div>
          <div className="readout-row">
            <span className="label">Alerts</span>
            <span className={`v ${alertCount ? 'acc' : ''}`}>{alertCount}</span>
          </div>
          <div className="readout-row">
            <span className="label">Air quality</span>
            <span className="v">{aqiCategory ?? '—'}</span>
          </div>
          <div className="readout-row">
            <span className="label">Incidents</span>
            <span className="v">{incidentCount}</span>
          </div>
        </div>
      </section>

      <FirePanel fires={fires.data} />
      <AlertBanner alerts={alerts.data} />
      <AQIPanel aqi={aqi.data} />
      <IncidentsPanel incidents={incidents.data} />
      <RenoMap fires={fires.data} incidents={incidents.data} />

      <footer className="foot">
        <span>RENO · SPARKS · FIRES NIFC · ALERTS NWS · AIR AIRNOW · ROADS NV511</span>
        <span>39.5°N 119.8°W · WASHOE COUNTY · 2026</span>
      </footer>
    </main>
  );
}
