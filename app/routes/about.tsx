// About — minimal instrument-styled page. Global chrome lives in app/root.tsx.
export default function AboutComponent() {
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <h1>
            About <em>TahoeSno.</em>
          </h1>
          <p>
            A backcountry-style instrument for Sierra Nevada and British
            Columbia snow conditions. Weather is sourced from Open-Meteo; resort
            lift and trail telemetry comes from direct resort feeds where
            available.
          </p>
        </div>
        <div className="readout">
          <div className="readout-row">
            <span className="label">Weather</span>
            <span className="v">Open-Meteo</span>
          </div>
          <div className="readout-row">
            <span className="label">Resort feeds</span>
            <span className="v acc">SkiAPI +</span>
          </div>
          <div className="readout-row">
            <span className="label">Refresh</span>
            <span className="v">
              60<span className="unit"> min</span>
            </span>
          </div>
        </div>
      </section>

      <footer className="foot">
        <span>TAHOESNO · WEATHER VIA OPEN-METEO</span>
        <span>SIERRA NEVADA · 2026 WINTER</span>
      </footer>
    </main>
  );
}
