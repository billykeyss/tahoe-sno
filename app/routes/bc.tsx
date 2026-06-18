import { ResortGrid } from '../components/ResortGrid';
import { RegionReadout } from '../components/RegionReadout';
import { WeatherProvider } from '../services/weatherStore';

// British Columbia & Canadian Rockies — same "Alpine Instrument" system as home.
// Global chrome (top bar, theme toggle) is provided by app/root.tsx.
export default function BCPage() {
  return (
    <WeatherProvider country="canada">
      <main className="wrap">
        <section className="hero">
          <div>
            <h1>
              The <em>Coast</em> is loaded. Go north.
            </h1>
            <p>
              Hourly snow, wind and lift telemetry for British Columbia and the
              Canadian Rockies. Read the mountain before the drive.
            </p>
          </div>
          <RegionReadout
            rows={[
              { label: 'Sea-to-Sky', value: 'Open', cls: 'acc' },
              {
                label: 'Freezing line',
                value: (
                  <>
                    1,500<span className="unit"> m</span>
                  </>
                ),
              },
            ]}
          />
        </section>

        <ResortGrid
          country="canada"
          featuredResorts={['louiselake', 'sunshine', 'norquay']}
        />

        <footer className="foot">
          <span>
            TAHOESNO · WEATHER VIA OPEN-METEO · STATION DATA REFRESHED HOURLY
          </span>
          <span>51.4°N 116.2°W · CANADIAN ROCKIES · 2026 WINTER</span>
        </footer>
      </main>
    </WeatherProvider>
  );
}
