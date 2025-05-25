import { useState, useEffect } from 'react';
import { apiClient, type AvalancheData } from '../services/apiClient';
import './AvalancheDanger.css';

const DANGER_LEVELS = [
  {
    level: 1,
    text: 'Low',
    color: '#00c851',
    description: 'Generally safe avalanche conditions',
  },
  {
    level: 2,
    text: 'Moderate',
    color: '#ffbb33',
    description: 'Heightened awareness is needed',
  },
  {
    level: 3,
    text: 'Considerable',
    color: '#ff8800',
    description: 'Dangerous avalanche conditions',
  },
  {
    level: 4,
    text: 'High',
    color: '#ff4444',
    description: 'Very dangerous avalanche conditions',
  },
  {
    level: 5,
    text: 'Extreme',
    color: '#cc0000',
    description: 'Avoid avalanche terrain',
  },
];

const PROBLEM_ICONS = {
  'Wind Slab': '💨',
  'Storm Slab': '⛈️',
  'Persistent Slab': '🧊',
  'Deep Persistent Slab': '🏔️',
  'Wet Avalanche': '💧',
  'Cornice Fall': '🪨',
  'Loose Snow': '❄️',
};

export function AvalancheDanger() {
  const [avalancheData, setAvalancheData] = useState<AvalancheData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvalancheData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getAvalancheDanger();
        setAvalancheData(data);
      } catch (err) {
        console.error('Error fetching avalanche data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load avalanche data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAvalancheData();

    // Refresh avalanche data every 6 hours (as specified in original requirements)
    const refreshInterval = setInterval(fetchAvalancheData, 6 * 60 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  if (loading) {
    return (
      <section className="avalanche-danger loading">
        <div className="loading-shimmer">
          <div className="shimmer-title"></div>
          <div className="shimmer-content"></div>
        </div>
      </section>
    );
  }

  if (error || !avalancheData) {
    return (
      <section className="avalanche-danger error">
        <h2>Avalanche Danger</h2>
        <p>Unable to load avalanche data</p>
        <small>{error}</small>
      </section>
    );
  }

  const currentLevel = DANGER_LEVELS.find(
    (level) => level.level === avalancheData.danger_level
  );

  return (
    <section className="avalanche-danger">
      <div className="avalanche-header">
        <h2>Sierra Avalanche Danger</h2>
        <div className="last-updated">
          Last updated:{' '}
          {new Date(avalancheData.last_updated).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>
      </div>

      <div className="danger-strip">
        {DANGER_LEVELS.map((level) => (
          <div
            key={level.level}
            className={`danger-level ${
              level.level === avalancheData.danger_level ? 'active' : ''
            }`}
            style={{ backgroundColor: level.color }}
            title={level.description}
          >
            <span className="level-number">{level.level}</span>
            <span className="level-text">{level.text}</span>
          </div>
        ))}
      </div>

      <div className="danger-details">
        <div className="current-rating">
          <span className="rating-label">Current Rating:</span>
          <span className="rating-value" style={{ color: currentLevel?.color }}>
            {currentLevel?.level} - {currentLevel?.text}
          </span>
        </div>

        {avalancheData.problems.length > 0 && (
          <div className="avalanche-problems">
            <span className="problems-label">Avalanche Problems:</span>
            <div className="problems-list">
              {avalancheData.problems.map((problem) => (
                <span key={problem} className="problem-item">
                  {PROBLEM_ICONS[problem as keyof typeof PROBLEM_ICONS] || '⚠️'}{' '}
                  {problem}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="danger-description">
          <p>{avalancheData.danger_text}</p>
        </div>
      </div>
    </section>
  );
}
