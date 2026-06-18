import { ResortGrid } from './components/ResortGrid';
import { RegionReadout } from './components/RegionReadout';
import { RoadStatus } from './components/RoadStatus';
import { AlertBanner } from './components/AlertBanner';
import { SnowRadar } from './components/SnowRadar';
import { HeroHeadline } from './components/HeroHeadline';
import { SourceTip } from './components/SourceTip';
import { WeatherProvider } from './services/weatherStore';
import {
  useRoads,
  useAlerts,
  type RoadStatusData,
  type Sourced,
} from './services/stationData';

// Central Lake Tahoe point used for the regional NWS alert check.
const TAHOE_POINT = { lat: 39.09, lon: -120.03 };

const CHAIN_ORDER: Record<string, number> = {
  none: 0,
  unknown: 1,
  R1: 2,
  R2: 3,
  R3: 4,
};
const CHAIN_LABEL: Record<string, string> = {
  none: 'R-0',
  unknown: '—',
  R1: 'R-1',
  R2: 'R-2',
  R3: 'R-3',
};

function i80Chains(roads: Sourced<RoadStatusData> | null): {
  code: string;
  cls: string;
} {
  if (!roads) return { code: '—', cls: '' };
  const worst = roads.data.chainControls
    .filter((c) => c.route === 'I-80')
    .reduce((w, c) => (CHAIN_ORDER[c.status] > CHAIN_ORDER[w] ? c.status : w), 'none');
  return { code: CHAIN_LABEL[worst], cls: worst === 'none' ? '' : 'acc' };
}

// Homepage — "Alpine Instrument" station readout for the Lake Tahoe ski areas.
// Global chrome (top bar, theme toggle, grid overlay) lives in app/root.tsx.
export function App() {
  const roads = useRoads();
  const alerts = useAlerts(TAHOE_POINT.lat, TAHOE_POINT.lon);

  const chains = i80Chains(roads.data);
  const alertCount = alerts.data?.data.length ?? 0;

  return (
    <WeatherProvider country="usa">
      <main className="wrap">
        {/* HERO — a station readout, not a centered gradient headline */}
        <section className="hero">
          <div>
            <HeroHeadline place="Tahoe" />
            <p>
              Hourly snow, wind and snowpack telemetry for every Sierra Nevada
              ski area. Read the mountain before you drive the pass.
            </p>
          </div>
          <RegionReadout
            rows={[
              {
                label: 'Chains I-80',
                value: (
                  <SourceTip
                    source="Caltrans"
                    detail="Worst active chain control on I-80"
                  >
                    {chains.code}
                  </SourceTip>
                ),
                cls: chains.cls,
              },
              {
                label: 'NWS alerts',
                value: (
                  <SourceTip
                    source="NWS"
                    detail="Active weather alerts for the Tahoe region"
                  >
                    {alertCount}
                  </SourceTip>
                ),
                cls: alertCount ? 'acc' : '',
              },
            ]}
          />
        </section>

        <AlertBanner alerts={alerts.data} />
        <RoadStatus roads={roads.data} loading={roads.loading} />

        <SnowRadar />

        <ResortGrid />

        <footer className="foot">
          <span>
            TAHOESNO · WEATHER OPEN-METEO · SNOWPACK CDEC · ROADS CALTRANS ·
            ALERTS NWS
          </span>
          <span>40.7°N 120.0°W · SIERRA NEVADA · 2026 WINTER</span>
        </footer>
      </main>
    </WeatherProvider>
  );
}

export default App;
