import { useState, useEffect } from 'react';
import { apiClient, type ChainControl } from '../services/apiClient';
import './TravelBanner.css';

const STATUS_ICONS = {
  None: '✅',
  Advised: '⚠️',
  Required: '🔗',
  Prohibited: '🚫',
};

const STATUS_COLORS = {
  None: '#00c851',
  Advised: '#ffbb33',
  Required: '#ff8800',
  Prohibited: '#ff4444',
};

export function TravelBanner() {
  const [chainControls, setChainControls] = useState<ChainControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChainControls = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getChainControls();
        setChainControls(data);
      } catch (err) {
        console.error('Error fetching chain control data:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load chain control data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChainControls();

    // Refresh chain control data every 15 minutes (as specified in requirements)
    const refreshInterval = setInterval(fetchChainControls, 15 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) {
    return (
      <section className="travel-banner loading">
        <div className="loading-shimmer">
          <div className="shimmer-title"></div>
          <div className="shimmer-content"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="travel-banner error">
        <h2>Chain Controls</h2>
        <p>Unable to load chain control data</p>
        <small>{error}</small>
      </section>
    );
  }

  return (
    <section className="travel-banner">
      <div className="banner-header">
        <h2>⛓️ Chain Control Status</h2>
        <div className="last-updated">
          Last updated:{' '}
          {chainControls[0]?.last_updated
            ? new Date(chainControls[0].last_updated).toLocaleTimeString(
                'en-US',
                {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                }
              )
            : 'N/A'}
        </div>
      </div>

      <div className="chain-status-grid">
        {chainControls.map((route) => (
          <div
            key={route.route}
            className="route-status"
            style={{ borderLeftColor: STATUS_COLORS[route.status] }}
          >
            <div className="route-header">
              <span className="route-name">{route.route}</span>
              <span
                className="status-badge"
                style={{ backgroundColor: STATUS_COLORS[route.status] }}
              >
                {STATUS_ICONS[route.status]} {route.status}
              </span>
            </div>
            <div className="route-description">{route.description}</div>
          </div>
        ))}
      </div>

      <div className="chain-legend">
        <span className="legend-title">Legend:</span>
        {Object.entries(STATUS_ICONS).map(([status, icon]) => (
          <span key={status} className="legend-item">
            {icon} {status}
          </span>
        ))}
      </div>
    </section>
  );
}
