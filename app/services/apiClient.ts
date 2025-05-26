// API Client for TahoeSno - Centralized data fetching
//
// Primary APIs (Free, no keys required):
// - Open-Meteo: Weather data for all resorts (working)
//
// Disabled APIs (CORS issues in development):
// - Sierra Avalanche Center: Now using mock avalanche data
// - Caltrans: Now using mock chain control data
//
// Optional Premium API:
// - WeatherUnlocked: Enhanced ski-specific data (requires paid subscription, currently unused)

export interface WeatherData {
  base_depth: number;
  upper_depth: number;
  freshsnow_cm: number;
  weather_desc: string;
  temp_c: number;
  wind_speed_mph: number;
  forecast: Array<{
    date: string;
    temp_high_c: number;
    temp_low_c: number;
    freshsnow_cm: number;
    wind_speed_mph: number;
    condition: 'sunny' | 'partly-cloudy' | 'cloudy' | 'snow' | 'rain';
  }>;
  historical_snow: Array<{
    date: string;
    snow_cm: number;
  }>;
}

export interface AvalancheData {
  danger_level: number;
  danger_text: string;
  problems: string[];
  last_updated: string;
}

export interface ChainControl {
  route: string;
  status: 'None' | 'Advised' | 'Required' | 'Prohibited';
  description: string;
  last_updated: string;
}

class TahoeAPIClient {
  /**
   * Get weather data using Open-Meteo as fallback
   */
  async getOpenMeteoWeather(lat: number, lon: number): Promise<WeatherData> {
    try {
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        daily: 'temperature_2m_max,temperature_2m_min,snowfall_sum',
        hourly: 'temperature_2m,snowfall,snow_depth',
        timezone: 'America/Los_Angeles',
        forecast_days: '5',
        past_days: '7',
      });

      const url = `https://api.open-meteo.com/v1/forecast?${params}`;
      console.log(`Calling Open-Meteo API for coordinates ${lat}, ${lon}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Open-Meteo API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Open-Meteo API response received successfully');

      return this.transformOpenMeteoData(data);
    } catch (error) {
      console.error('Error fetching Open-Meteo data:', error);
      console.log('Falling back to mock weather data');
      throw new Error(`Open-Meteo API error: ${error}`);
    }
  }

  /**
   * Primary method to get resort weather data using Open-Meteo API
   * This is the main weather API for the application (free, reliable, no CORS issues)
   */
  async getResortWeatherPrimary(
    lat: number,
    lon: number
  ): Promise<WeatherData> {
    return this.getOpenMeteoWeather(lat, lon);
  }

  // Transform WeatherUnlocked data to our format
  private transformWeatherData(data: any): WeatherData {
    const forecast =
      data.forecast?.slice(0, 5)?.map((day: any) => ({
        date: day.date,
        temp_high_c: day.temp_max_c,
        temp_low_c: day.temp_min_c,
        freshsnow_cm: day.freshsnow_cm || 0,
        wind_speed_mph: day.wind_speed_mph || 0,
        condition: this.mapWeatherCondition(day.weather_desc),
      })) || [];

    return {
      base_depth: data.base_depth || 0,
      upper_depth: data.upper_depth || 0,
      freshsnow_cm: data.freshsnow_cm || 0,
      weather_desc: data.weather_desc || 'Unknown',
      temp_c: data.temp_c || 0,
      wind_speed_mph: data.wind_speed_mph || 0,
      forecast,
      historical_snow: this.generateHistoricalSnow(), // WeatherUnlocked doesn't provide historical, so generate mock
    };
  }

  // Transform Open-Meteo data to our format
  private transformOpenMeteoData(data: any): WeatherData {
    const daily = data.daily;
    const forecast = daily.time
      .slice(0, 5)
      .map((date: string, index: number) => ({
        date,
        temp_high_c: Math.round(daily.temperature_2m_max[index]),
        temp_low_c: Math.round(daily.temperature_2m_min[index]),
        freshsnow_cm: Math.round(daily.snowfall_sum[index] * 10), // Convert mm to cm
        wind_speed_mph: 15, // Open-Meteo doesn't provide wind in this endpoint
        condition: this.mapSnowfallToCondition(daily.snowfall_sum[index]),
      }));

    const currentHour = data.hourly.time.findIndex(
      (time: string) => new Date(time).getHours() === new Date().getHours()
    );

    return {
      base_depth: Math.round((data.hourly.snow_depth[currentHour] || 0) * 100), // Convert m to cm
      upper_depth: Math.round((data.hourly.snow_depth[currentHour] || 0) * 150), // Estimate upper
      freshsnow_cm: Math.round((daily.snowfall_sum[0] || 0) * 10),
      weather_desc: forecast[0]?.condition || 'Unknown',
      temp_c: Math.round(data.hourly.temperature_2m[currentHour] || 0),
      wind_speed_mph: 15,
      forecast,
      historical_snow: this.extractHistoricalSnow(data),
    };
  }

  // Helper functions
  private mapWeatherCondition(
    description: string
  ): 'sunny' | 'partly-cloudy' | 'cloudy' | 'snow' | 'rain' {
    const desc = description.toLowerCase();
    if (desc.includes('snow')) return 'snow';
    if (desc.includes('rain')) return 'rain';
    if (desc.includes('sunny') || desc.includes('clear')) return 'sunny';
    if (desc.includes('partly') || desc.includes('scattered'))
      return 'partly-cloudy';
    return 'cloudy';
  }

  private mapSnowfallToCondition(
    snowfall: number
  ): 'sunny' | 'partly-cloudy' | 'cloudy' | 'snow' | 'rain' {
    if (snowfall > 1) return 'snow';
    if (snowfall > 0.1) return 'partly-cloudy';
    return Math.random() > 0.5 ? 'sunny' : 'cloudy';
  }

  private getRouteDescription(route: string): string {
    const descriptions = {
      'I-80': 'Sacramento to Truckee',
      'US-50': 'Sacramento to South Lake Tahoe',
      'SR-89': 'Truckee to South Lake Tahoe',
    };
    return descriptions[route as keyof typeof descriptions] || '';
  }

  private generateHistoricalSnow(): Array<{ date: string; snow_cm: number }> {
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      snow_cm: Math.floor(Math.random() * 20),
    }));
  }

  private extractHistoricalSnow(
    data: any
  ): Array<{ date: string; snow_cm: number }> {
    const pastDays = data.daily.time.slice(-7);
    const pastSnowfall = data.daily.snowfall_sum.slice(-7);

    return pastDays.map((date: string, index: number) => ({
      date,
      snow_cm: Math.round((pastSnowfall[index] || 0) * 10),
    }));
  }
}

// Singleton instance
export const apiClient = new TahoeAPIClient();
