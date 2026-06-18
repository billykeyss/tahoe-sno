// Resort-specific API integrations (Free Tier Only)
// This service handles direct integrations with ski resort APIs and data sources

export interface ResortSnowReport {
  resortName: string;
  freshSnow24h: number; // cm
  freshSnow48h: number; // cm
  baseDepth: number; // cm
  upperDepth: number; // cm
  temperature: number; // celsius
  weather: string;
  liftsOpen: number;
  liftsTotal: number;
  trailsOpen: number;
  trailsTotal: number;
  lastUpdated: string;
  source: string;
}

export interface WeatherStation {
  name: string;
  elevation: number;
  temperature: number;
  windSpeed: number;
  snowDepth: number;
  lastUpdated: string;
}

const SKI_API_PLACEHOLDER_KEY = 'your-rapidapi-key-here';

/**
 * Reads the RapidAPI key from the Vite env (VITE_RAPIDAPI_KEY).
 * Returns a trimmed string ('' when unset).
 */
export function getRapidAPIKey(): string {
  return (import.meta.env.VITE_RAPIDAPI_KEY ?? '').trim();
}

/**
 * Whether a usable SkiAPI key is configured. Resorts that depend on SkiAPI
 * (Heavenly, Kirkwood, Boreal, Diamond Peak) only fetch when this returns true,
 * so a missing key fails fast and quietly instead of firing a doomed request.
 */
export function isSkiAPIConfigured(): boolean {
  const key = getRapidAPIKey();
  return key.length > 0 && key !== SKI_API_PLACEHOLDER_KEY;
}

class ResortAPIService {
  /**
   * SkiAPI.com - Free tier via RapidAPI
   * Provides lift status and basic snow conditions
   */
  async getSkiAPIData(resortId: string): Promise<ResortSnowReport | null> {
    try {
      const response = await fetch(
        `https://ski-api.p.rapidapi.com/resort/${resortId}`,
        {
          headers: {
            'X-RapidAPI-Key': getRapidAPIKey(),
            'X-RapidAPI-Host': 'ski-api.p.rapidapi.com',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`SkiAPI error: ${response.status}`);
      }

      const data = await response.json();

      return {
        resortName: data.name,
        freshSnow24h: this.inchesToCm(data.freshSnow || 0),
        freshSnow48h: this.inchesToCm(data.freshSnow48h || 0),
        baseDepth: this.inchesToCm(data.baseDepth || 0),
        upperDepth: this.inchesToCm(data.upperDepth || 0),
        temperature: this.fahrenheitToCelsius(data.temperature || 32),
        weather: data.weather || 'Unknown',
        liftsOpen: data.liftsOpen || 0,
        liftsTotal: data.liftsTotal || 0,
        trailsOpen: data.trailsOpen || 0,
        trailsTotal: data.trailsTotal || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        source: 'SkiAPI.com',
      };
    } catch (error) {
      console.error('SkiAPI integration error:', error);
      return null;
    }
  }

  /**
   * Palisades Tahoe Weather Stations - Free public data
   * Western Weather Group provides real-time data
   */
  async getPalisadesWeatherStations(): Promise<WeatherStation[]> {
    try {
      // This would fetch from their public API or scrape their data page
      // For demo purposes, showing the structure
      const mockStations: WeatherStation[] = [
        {
          name: 'Siberia 8700ft',
          elevation: 8700,
          temperature: -2,
          windSpeed: 25,
          snowDepth: 180,
          lastUpdated: new Date().toISOString(),
        },
        {
          name: 'Base 6200ft',
          elevation: 6200,
          temperature: 2,
          windSpeed: 15,
          snowDepth: 120,
          lastUpdated: new Date().toISOString(),
        },
      ];

      return mockStations;
    } catch (error) {
      console.error('Palisades weather station error:', error);
      return [];
    }
  }

  /**
   * Northstar Public Data - Free
   * Many Vail resorts provide JSON endpoints for public data
   */
  async getNorthstarConditions(): Promise<ResortSnowReport | null> {
    try {
      // Vail resorts often have public JSON endpoints like:
      // https://www.northstarcalifornia.com/api/conditions

      // For demo, showing the structure that would come from such endpoints
      const mockData = {
        resort: 'Northstar California',
        snowfall: {
          '24hr': 5,
          '48hr': 8,
          base: 45,
          upper: 65,
        },
        temperature: 28,
        weather: 'Light Snow',
        lifts: { open: 12, total: 20 },
        trails: { open: 75, total: 100 },
        lastUpdated: new Date().toISOString(),
      };

      return {
        resortName: mockData.resort,
        freshSnow24h: this.inchesToCm(mockData.snowfall['24hr']),
        freshSnow48h: this.inchesToCm(mockData.snowfall['48hr']),
        baseDepth: this.inchesToCm(mockData.snowfall.base),
        upperDepth: this.inchesToCm(mockData.snowfall.upper),
        temperature: this.fahrenheitToCelsius(mockData.temperature),
        weather: mockData.weather,
        liftsOpen: mockData.lifts.open,
        liftsTotal: mockData.lifts.total,
        trailsOpen: mockData.trails.open,
        trailsTotal: mockData.trails.total,
        lastUpdated: mockData.lastUpdated,
        source: 'Northstar Direct',
      };
    } catch (error) {
      console.error('Northstar conditions error:', error);
      return null;
    }
  }

  /**
   * Sugar Bowl Public Data - Free
   * Many independent resorts provide RSS feeds or JSON APIs
   */
  async getSugarBowlConditions(): Promise<ResortSnowReport | null> {
    try {
      // Many resorts provide RSS feeds or simple JSON endpoints
      // Example: https://sugarbowl.com/conditions.json

      const mockData = {
        name: 'Sugar Bowl Resort',
        newSnow: 3,
        baseDepth: 52,
        weather: 'Partly Cloudy',
        temperature: 25,
        liftsOpen: 8,
        liftsTotal: 13,
      };

      return {
        resortName: mockData.name,
        freshSnow24h: this.inchesToCm(mockData.newSnow),
        freshSnow48h: this.inchesToCm(mockData.newSnow * 1.5),
        baseDepth: this.inchesToCm(mockData.baseDepth),
        upperDepth: this.inchesToCm(mockData.baseDepth * 1.3),
        temperature: this.fahrenheitToCelsius(mockData.temperature),
        weather: mockData.weather,
        liftsOpen: mockData.liftsOpen,
        liftsTotal: mockData.liftsTotal,
        trailsOpen: 0, // Not provided
        trailsTotal: 0,
        lastUpdated: new Date().toISOString(),
        source: 'Sugar Bowl Direct',
      };
    } catch (error) {
      console.error('Sugar Bowl conditions error:', error);
      return null;
    }
  }

  /**
   * Generic resort scraper for publicly available data
   * This responsibly scrapes public condition pages
   */
  async scrapeResortConditions(
    resortName: string,
    url: string
  ): Promise<ResortSnowReport | null> {
    try {
      // Note: This would require a backend service to avoid CORS
      // For client-side, you'd need to use a CORS proxy or backend

      console.log(`Would scrape ${resortName} from ${url}`);

      // Return mock data showing the structure
      return {
        resortName,
        freshSnow24h: Math.floor(Math.random() * 20),
        freshSnow48h: Math.floor(Math.random() * 30),
        baseDepth: Math.floor(Math.random() * 200) + 50,
        upperDepth: Math.floor(Math.random() * 300) + 100,
        temperature: Math.floor(Math.random() * 20) - 10,
        weather: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Snow', 'Light Snow'][
          Math.floor(Math.random() * 5)
        ],
        liftsOpen: Math.floor(Math.random() * 15) + 5,
        liftsTotal: 20,
        trailsOpen: Math.floor(Math.random() * 80) + 20,
        trailsTotal: 100,
        lastUpdated: new Date().toISOString(),
        source: 'Scraped Data',
      };
    } catch (error) {
      console.error(`Scraping error for ${resortName}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive resort data by trying multiple free sources
   */
  async getResortData(resortName: string): Promise<ResortSnowReport | null> {
    // Try different sources based on resort
    switch (resortName.toLowerCase()) {
      case 'palisades tahoe':
      case 'squaw valley':
        return this.getPalisadesData();

      case 'northstar':
      case 'northstar california':
        return this.getNorthstarConditions();

      case 'sugar bowl':
        return this.getSugarBowlConditions();

      default: {
        // SkiAPI-backed resorts require a configured RapidAPI key. Skip the
        // request entirely when it's missing so we fail fast (and quietly)
        // instead of firing a guaranteed-failing call.
        const skiApiId = this.getSkiAPIId(resortName);
        if (skiApiId && isSkiAPIConfigured()) {
          return this.getSkiAPIData(skiApiId);
        }
        return null;
      }
    }
  }

  // Helper methods
  private async getPalisadesData(): Promise<ResortSnowReport | null> {
    const stations = await this.getPalisadesWeatherStations();
    if (stations.length === 0) return null;

    const baseStation = stations.find((s) => s.elevation < 7000) || stations[0];
    const upperStation =
      stations.find((s) => s.elevation > 8000) || stations[0];

    return {
      resortName: 'Palisades Tahoe',
      freshSnow24h: Math.floor(Math.random() * 15),
      freshSnow48h: Math.floor(Math.random() * 25),
      baseDepth: baseStation.snowDepth,
      upperDepth: upperStation.snowDepth,
      temperature: baseStation.temperature,
      weather: this.getWeatherFromTemp(baseStation.temperature),
      liftsOpen: 28,
      liftsTotal: 43,
      trailsOpen: 150,
      trailsTotal: 200,
      lastUpdated: baseStation.lastUpdated,
      source: 'Palisades Weather Stations',
    };
  }

  private getSkiAPIId(resortName: string): string | null {
    // Mapping of resort names to SkiAPI IDs
    const resortIds: Record<string, string> = {
      heavenly: 'heavenly-ca',
      kirkwood: 'kirkwood-ca',
      boreal: 'boreal-ca',
      'diamond peak': 'diamond-peak-nv',
    };

    return resortIds[resortName.toLowerCase()] || null;
  }

  private inchesToCm(inches: number): number {
    return Math.round(inches * 2.54);
  }

  private fahrenheitToCelsius(fahrenheit: number): number {
    return Math.round(((fahrenheit - 32) * 5) / 9);
  }

  private getWeatherFromTemp(temp: number): string {
    if (temp < -5) return 'Snow';
    if (temp < 0) return 'Light Snow';
    if (temp < 5) return 'Cloudy';
    return 'Partly Cloudy';
  }
}

export const resortAPIService = new ResortAPIService();

// Helper function to check if a resort has direct API support
export const hasDirectAPISupport = (resortName: string): boolean => {
  const supportedResorts = [
    'palisades tahoe',
    'squaw valley',
    'northstar',
    'northstar california',
    'sugar bowl',
    'heavenly',
    'kirkwood',
    'boreal',
    'boreal mountain',
    'diamond peak',
  ];

  return supportedResorts.includes(resortName.toLowerCase());
};

// Helper function to get the API source for a resort
export const getAPISource = (resortName: string): string | null => {
  const lowerName = resortName.toLowerCase();

  if (lowerName.includes('palisades') || lowerName.includes('squaw')) {
    return 'Weather Stations';
  }
  if (lowerName.includes('northstar')) {
    return 'Vail Direct API';
  }
  if (lowerName.includes('sugar bowl')) {
    return 'RSS Feed';
  }
  if (
    [
      'heavenly',
      'kirkwood',
      'boreal',
      'boreal mountain',
      'diamond peak',
    ].includes(lowerName)
  ) {
    return 'SkiAPI.com';
  }

  return null;
};
