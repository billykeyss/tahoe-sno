import { ResortGrid } from './components/ResortGrid';
import { RegionReadout } from './components/RegionReadout';
import { WeatherProvider } from './services/weatherStore';

// Homepage — "Alpine Instrument" station readout for the Lake Tahoe ski areas.
// Global chrome (top bar, theme toggle, grid overlay) lives in app/root.tsx.
export function App() {
  return (
    <WeatherProvider country="usa">
      <main className="wrap">
        {/* HERO — a station readout, not a centered gradient headline */}
        <section className="hero">
          <div>
            <h1>
              Tahoe is <em>storming.</em> Pick your line.
            </h1>
            <p>
              Hourly snow, wind and lift telemetry for every Sierra Nevada ski
              area. Read the mountain before you drive the pass.
            </p>
          </div>
          <RegionReadout
            rows={[
              { label: 'Chains I-80', value: 'R-2', cls: 'acc' },
              {
                label: 'Freezing line',
                value: (
                  <>
                    6,400<span className="unit"> ft</span>
                  </>
                ),
              },
            ]}
          />
        </section>

        <ResortGrid />

        <footer className="foot">
          <span>
            TAHOESNO · WEATHER VIA OPEN-METEO · STATION DATA REFRESHED HOURLY
          </span>
          <span>40.7°N 120.0°W · SIERRA NEVADA · 2026 WINTER</span>
        </footer>
      </main>
    </WeatherProvider>
  );
}

export default App;
