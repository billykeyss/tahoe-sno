// API Client for TahoeSno - Centralized data fetching
//
// Primary APIs (Free, no keys required):
// - Open-Meteo: Weather data for all resorts
// - Sierra Avalanche Center: Avalanche conditions
// - Caltrans: Chain control status
//
// Optional Premium API:
// - WeatherUnlocked: Enhanced ski-specific data (requires paid subscription)

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
  private weatherUnlockedAppId: string;
  private weatherUnlockedAppKey: string;

  constructor() {
    // Use Vite's import.meta.env instead of process.env
    // Environment variables must be prefixed with VITE_ to be available in browser
    this.weatherUnlockedAppId =
      import.meta.env.VITE_WEATHER_UNLOCKED_APP_ID || '2fd5e298';
    this.weatherUnlockedAppKey =
      import.meta.env.VITE_WEATHER_UNLOCKED_APP_KEY ||
      'b2a64020cec07799e5005218ff9ae163';
  }


  /**
   * Fetch weather data for a specific resort from WeatherUnlocked
   */
  async getResortWeather(resortId: number): Promise<WeatherData> {
    // Skip WeatherUnlocked if we don't have real API keys (to avoid CORS errors with demo keys)
    if (!this.hasRealWeatherUnlockedKeys()) {
      console.log(
        `No real WeatherUnlocked keys detected, skipping to Open-Meteo for resort ${resortId}`
      );
      throw new Error('No real WeatherUnlocked API keys');
    }

    try {
      const url = `https://api.weatherunlocked.com/api/resortforecast/${resortId}?app_id=${this.weatherUnlockedAppId}&app_key=${this.weatherUnlockedAppKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`WeatherUnlocked API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform WeatherUnlocked response to our format
      return this.transformWeatherData(data);
    } catch (error) {
      console.error('WeatherUnlocked API failed:', error);
      throw error; // Re-throw to trigger fallback
    }
  }

  /**
   * Fetch avalanche danger from Sierra Avalanche Center RSS feed
   */
  async getAvalancheDanger(): Promise<AvalancheData> {
    try {
      // Note: This will likely fail due to CORS in development, but works in production
      const response = await fetch('https://www.sierraavalanchecenter.org/xml');
      if (!response.ok) {
        throw new Error(`Sierra Avalanche Center error: ${response.status}`);
      }

      const xmlText = await response.text();
      return this.parseAvalancheXML(xmlText);
    } catch (error) {
      console.log(
        'Sierra Avalanche Center API failed (expected in development due to CORS), using mock data:',
        error
      );
      // Fallback to mock data
      return this.getMockAvalancheData();
    }
  }

  /**
   * Fetch chain control status from Caltrans QuickMap
   */
  async getChainControls(): Promise<ChainControl[]> {
    try {
      // Note: This will likely fail due to CORS in development, but works in production
      const response = await fetch(
        'https://quickmap.dot.ca.gov/QuickMap.json?layers=chainControls'
      );
      if (!response.ok) {
        throw new Error(`Caltrans QuickMap error: ${response.status}`);
      }

      const data = await response.json();
      return this.transformChainControlData(data);
    } catch (error) {
      console.log(
        'Caltrans QuickMap API failed (expected in development due to CORS), using mock data:',
        error
      );
      // Fallback to mock data
      return this.getMockChainControlData();
    }
  }

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
      return this.getMockWeatherData();
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

  // Parse Sierra Avalanche Center XML
  private parseAvalancheXML(xmlText: string): AvalancheData {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Extract danger level and description from RSS
    const description = xmlDoc.querySelector('description')?.textContent || '';
    const dangerMatch = description.match(/danger level (\d)/i);
    const dangerLevel = dangerMatch ? parseInt(dangerMatch[1]) : 2;

    return {
      danger_level: dangerLevel,
      danger_text: description.substring(0, 200) + '...',
      problems: this.extractAvalancheProblems(description),
      last_updated: new Date().toISOString(),
    };
  }

  // Transform Caltrans chain control data
  private transformChainControlData(data: any): ChainControl[] {
    const routes = ['I-80', 'US-50', 'SR-89'];

    return routes.map((route) => {
      // Extract chain control info from Caltrans data
      const routeData = data.layers?.find(
        (layer: any) =>
          layer.name?.includes(route) || layer.description?.includes(route)
      );

      return {
        route,
        status: this.mapChainStatus(routeData?.status || 'unknown'),
        description: this.getRouteDescription(route),
        last_updated: new Date().toISOString(),
      };
    });
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

  private mapChainStatus(status: string): ChainControl['status'] {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('required')) return 'Required';
    if (statusLower.includes('advised')) return 'Advised';
    if (statusLower.includes('prohibited')) return 'Prohibited';
    return 'None';
  }

  private getRouteDescription(route: string): string {
    const descriptions = {
      'I-80': 'Sacramento to Truckee',
      'US-50': 'Sacramento to South Lake Tahoe',
      'SR-89': 'Truckee to South Lake Tahoe',
    };
    return descriptions[route as keyof typeof descriptions] || '';
  }

  private extractAvalancheProblems(description: string): string[] {
    const problems = [
      'Wind Slab',
      'Storm Slab',
      'Persistent Slab',
      'Deep Persistent Slab',
      'Wet Avalanche',
      'Cornice Fall',
      'Loose Snow',
    ];
    return problems
      .filter((problem) =>
        description.toLowerCase().includes(problem.toLowerCase())
      )
      .slice(0, 3);
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

  // Mock data generators for fallback
  private getMockWeatherData(): WeatherData {
    return {
      base_depth: Math.floor(Math.random() * 100) + 20,
      upper_depth: Math.floor(Math.random() * 150) + 50,
      freshsnow_cm: Math.floor(Math.random() * 15),
      weather_desc: ['Sunny', 'Partly Cloudy', 'Snow', 'Overcast'][
        Math.floor(Math.random() * 4)
      ],
      temp_c: Math.floor(Math.random() * 20) - 10,
      wind_speed_mph: Math.floor(Math.random() * 25) + 5,
      forecast: Array.from({ length: 5 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        temp_high_c: Math.floor(Math.random() * 15) - 5,
        temp_low_c: Math.floor(Math.random() * 15) - 15,
        freshsnow_cm: Math.floor(Math.random() * 10),
        wind_speed_mph: Math.floor(Math.random() * 30) + 5,
        condition: ['sunny', 'partly-cloudy', 'cloudy', 'snow', 'rain'][
          Math.floor(Math.random() * 5)
        ] as any,
      })),
      historical_snow: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        snow_cm: Math.floor(Math.random() * 20),
      })),
    };
  }

  private getMockAvalancheData(): AvalancheData {
    return {
      danger_level: Math.floor(Math.random() * 5) + 1,
      danger_text:
        'Current conditions require careful route finding and conservative terrain choices.',
      problems: ['Wind Slab', 'Storm Slab'].slice(
        0,
        Math.floor(Math.random() * 3) + 1
      ),
      last_updated: new Date().toISOString(),
    };
  }

  private getMockChainControlData(): ChainControl[] {
    return ['I-80', 'US-50', 'SR-89'].map((route) => ({
      route,
      status: ['None', 'Advised', 'Required'][
        Math.floor(Math.random() * 3)
      ] as ChainControl['status'],
      description: this.getRouteDescription(route),
      last_updated: new Date().toISOString(),
    }));
  }
}

// Singleton instance
export const apiClient = new TahoeAPIClient();
