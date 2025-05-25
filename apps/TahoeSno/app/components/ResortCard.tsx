import { useState, useEffect } from 'react';
import { Resort } from './ResortGrid';
import { apiClient, type WeatherData } from '../services/apiClient';
import './ResortCard.css';

interface ResortCardProps {
  resort: Resort;
}

const WEATHER_ICONS = {
  sunny: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  snow: '❄️',
  rain: '🌧️',
};

export function ResortCard({ resort }: ResortCardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use Open-Meteo as primary weather API (free, reliable, no CORS issues)
        const data = await apiClient.getResortWeatherPrimary(
          resort.coordinates.lat,
          resort.coordinates.lon
        );

        setWeatherData(data);
      } catch (err) {
        console.error(`Error fetching weather data for ${resort.name}:`, err);
        setError(
          err instanceof Error ? err.message : 'Failed to load weather data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();

    // Set up automatic refresh every 60 minutes
    const refreshInterval = setInterval(fetchWeatherData, 60 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [resort.coordinates, resort.name]);

  const formatDepth = (cm: number) =>
    `${Math.round(cm)}cm (${Math.round(cm * 0.393701)}")`;
  const formatTemp = (c: number) =>
    `${c}°C (${Math.round((c * 9) / 5 + 32)}°F)`;

  if (loading) {
    return (
      <div className="resort-card loading">
        <div className="loading-shimmer">
          <div className="shimmer-title"></div>
          <div className="shimmer-content"></div>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="resort-card error">
        <h3>{resort.name}</h3>
        <p>Unable to load data</p>
        <small>{error}</small>
      </div>
    );
  }

  const totalWeekSnow = weatherData.historical_snow.reduce(
    (sum, day) => sum + day.snow_cm,
    0
  );

  return (
    <div className="resort-card">
      <div className="resort-header">
        <h3 className="resort-name">{resort.name}</h3>
        <div className="weather-summary">
          <span className="weather-desc">{weatherData.weather_desc}</span>
          <span className="current-temp">{formatTemp(weatherData.temp_c)}</span>
        </div>
      </div>

      <div className="snow-data">
        <div className="snow-item">
          <span className="label">24h Fresh</span>
          <span className="value">{formatDepth(weatherData.freshsnow_cm)}</span>
        </div>
        <div className="snow-item">
          <span className="label">7-Day Total</span>
          <span className="value">{formatDepth(totalWeekSnow)}</span>
        </div>
        <div className="snow-item">
          <span className="label">Base Depth</span>
          <span className="value">{formatDepth(weatherData.base_depth)}</span>
        </div>
        <div className="snow-item">
          <span className="label">Summit Depth</span>
          <span className="value">{formatDepth(weatherData.upper_depth)}</span>
        </div>
      </div>

      <div className="historical-snow">
        <h4>Past 7 Days Snowfall</h4>
        <div className="snow-chart">
          {weatherData.historical_snow.map((day, index) => (
            <div key={day.date} className="snow-bar-container">
              <div
                className="snow-bar"
                style={{
                  height: `${Math.max(day.snow_cm * 3, 4)}px`,
                  backgroundColor:
                    day.snow_cm > 10
                      ? '#3498db'
                      : day.snow_cm > 5
                      ? '#74b9ff'
                      : '#ddd',
                }}
                title={`${day.snow_cm}cm on ${new Date(
                  day.date
                ).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}`}
              />
              <span className="snow-bar-label">
                {index === 6
                  ? 'Today'
                  : new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })}
              </span>
              <span className="snow-bar-value">{day.snow_cm}cm</span>
            </div>
          ))}
        </div>
      </div>

      <div className="forecast-mini">
        <h4>5-Day Forecast</h4>
        <div className="forecast-days">
          {weatherData.forecast.map((day, index) => (
            <div key={day.date} className="forecast-day">
              <div className="day-label">
                {index === 0
                  ? 'Today'
                  : new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })}
              </div>
              <div className="weather-icon">{WEATHER_ICONS[day.condition]}</div>
              <div className="day-temp">
                {Math.round(day.temp_high_c)}°/{Math.round(day.temp_low_c)}°
              </div>
              <div className="day-snow">
                {day.freshsnow_cm > 0 ? `${day.freshsnow_cm}cm` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="resort-footer">
        <div className="elevation-info">
          <span>Base: {resort.elevation.base}ft</span>
          <span>Summit: {resort.elevation.summit}ft</span>
        </div>
        <div className="wind-info">Wind: {weatherData.wind_speed_mph} mph</div>
      </div>
    </div>
  );
}
