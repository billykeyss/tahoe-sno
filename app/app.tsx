import { useMemo } from 'react';
import { MT_ROSE } from './config/mtrose';
import { WeatherProvider, useResortWeather } from './services/weatherStore';
import {
  useAlerts,
  useCams,
  useIncidents,
  useRoads,
  useSnowpack,
} from './services/stationData';
import { analyzePowder } from './services/powder';
import { RoseHero } from './components/rose/RoseHero';
import { RoseMap } from './components/rose/RoseMap';
import { WeatherNow } from './components/rose/WeatherNow';
import { PowderPanel } from './components/rose/PowderPanel';
import { BasePanel } from './components/rose/BasePanel';
import { PastSnow } from './components/rose/PastSnow';
import { ForecastRow } from './components/rose/ForecastRow';
import { CamsPanel } from './components/rose/CamsPanel';
import { AccessPanel } from './components/rose/AccessPanel';
import { CompareTable } from './components/rose/CompareTable';

// Homepage — the Mt Rose dashboard. One mountain, every signal that decides
// whether today is the day: new snow, what's on the ground, wind, the highway,
// and what's coming. The rest of the Sierra lives at /resorts.
function Dashboard() {
  const weather = useResortWeather(MT_ROSE.id);
  const { snowpack } = useSnowpack(MT_ROSE.id);
  const incidents = useIncidents();
  const roads = useRoads();
  const alerts = useAlerts(MT_ROSE.coordinates.lat, MT_ROSE.coordinates.lon);
  const cams = useCams();

  const powder = useMemo(
    () =>
      weather.data
        ? analyzePowder(weather.data, snowpack?.data ?? null, MT_ROSE.elevation)
        : null,
    [weather.data, snowpack]
  );

  return (
    <main className="wrap rose">
      <RoseHero
        weather={weather.data ?? null}
        snowpack={snowpack?.data ?? null}
        powder={powder}
        incidents={incidents.data?.data ?? null}
        alerts={alerts.data?.data ?? null}
        loading={weather.loading}
      />

      <RoseMap incidents={incidents.data} />

      <div className="rose-grid">
        <WeatherNow weather={weather.data ?? null} />
        <PowderPanel powder={powder} />
        <BasePanel snowpack={snowpack} weather={weather.data ?? null} densityPct={powder?.densityPct ?? null} />
        <PastSnow weather={weather.data ?? null} />
      </div>

      <ForecastRow weather={weather.data ?? null} />

      <CamsPanel cams={cams.data} />

      <div className="rose-grid">
        <AccessPanel incidents={incidents.data} roads={roads.data} alerts={alerts.data} />
        <CompareTable />
      </div>

      <footer className="foot">
        <span>
          TAHOESNO · WEATHER OPEN-METEO · SNOWPACK SNOTEL · ROADS NV511 + CALTRANS ·
          ALERTS NWS
        </span>
        <span>
          {MT_ROSE.coordinates.lat.toFixed(2)}°N {Math.abs(MT_ROSE.coordinates.lon).toFixed(2)}°W · MT ROSE · 2026 WINTER
        </span>
      </footer>
    </main>
  );
}

export function App() {
  return (
    <WeatherProvider country="usa" priority={[MT_ROSE.id]}>
      <Dashboard />
    </WeatherProvider>
  );
}

export default App;
