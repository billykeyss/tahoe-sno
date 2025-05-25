// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { ResortGrid } from './components/ResortGrid';
import { AvalancheDanger } from './components/AvalancheDanger';
import { TravelBanner } from './components/TravelBanner';
import './app.css';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="snow-icon">❄️</span>
          TahoeSno
          <span className="snow-icon">❄️</span>
        </h1>
        <p className="app-subtitle">
          Real-time Lake Tahoe ski conditions & forecasts
        </p>
      </header>

      <main className="app-main">
        <AvalancheDanger />
        <TravelBanner />
        <ResortGrid />
      </main>

      <footer className="app-footer">
        <p>
          Data from WeatherUnlocked, Sierra Avalanche Center, and Caltrans
          QuickMap
        </p>
      </footer>
    </div>
  );
}

export default App;
