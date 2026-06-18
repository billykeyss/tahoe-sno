# Free Resort API Integration Guide

This guide shows you how to integrate directly with ski resort APIs using only **free tier services** and publicly available data sources.

## 🆓 Free Options Available

### 1. **SkiAPI.com** (Free Tier via RapidAPI)

- **Cost**: Free tier available (500 requests/month)
- **Data**: Lift status, snow conditions, basic weather
- **Coverage**: Major North American resorts
- **Setup**:
  1. Sign up for free RapidAPI account
  2. Subscribe to SkiAPI free tier
  3. Get your API key

```typescript
// Example usage:
const response = await fetch('https://ski-api.p.rapidapi.com/resort/heavenly-ca', {
  headers: {
    'X-RapidAPI-Key': 'your-free-key-here',
    'X-RapidAPI-Host': 'ski-api.p.rapidapi.com',
  },
});
```

### 2. **Resort Weather Stations** (Completely Free)

- **Cost**: Free
- **Data**: Real-time weather from on-mountain stations
- **Coverage**: Most major resorts have public weather data
- **Examples**:
  - Palisades Tahoe: Weather station data feeds
  - Northstar: Vail resort APIs
  - Sugar Bowl: RSS feeds

### 3. **Public Resort Data Scraping** (Free but Limited)

- **Cost**: Free
- **Data**: Whatever resorts publish publicly
- **Coverage**: Resort-specific
- **Note**: Must be done responsibly and respectfully

## 🔧 Implementation

### Setting Up the Resort API Service

The service I created (`app/services/resortAPIs.ts`) demonstrates:

1. **SkiAPI Integration**: Free tier API calls
2. **Weather Station Data**: Public weather feeds
3. **Resort-specific APIs**: Direct resort integrations
4. **Responsible Scraping**: Guidelines for public data

### Key Features:

```typescript
interface ResortSnowReport {
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
  source: string; // Which API/source provided the data
}
```

## 📊 Data Sources by Resort

### Tahoe Resorts:

| Resort       | Free API         | Data Available       | Setup Required |
| ------------ | ---------------- | -------------------- | -------------- |
| Heavenly     | SkiAPI.com       | Lifts, snow, weather | RapidAPI key   |
| Kirkwood     | SkiAPI.com       | Lifts, snow, weather | RapidAPI key   |
| Northstar    | Vail API         | Snow conditions      | None           |
| Palisades    | Weather stations | Real-time weather    | None           |
| Sugar Bowl   | RSS feeds        | Snow report          | None           |
| Boreal       | SkiAPI.com       | Basic conditions     | RapidAPI key   |
| Diamond Peak | SkiAPI.com       | Basic conditions     | RapidAPI key   |

## 🛠️ How to Use

### 1. Get Your Free API Keys

```bash
# Sign up for RapidAPI (free)
# Subscribe to SkiAPI free tier
# Get your API key
```

### 2. Configure the API Key

The key is read from a Vite environment variable — never hardcode it in source.
Copy `.env.example` to `.env` and set your key:

```bash
cp .env.example .env
# then edit .env:
VITE_RAPIDAPI_KEY=your-actual-rapidapi-key-here
```

`.env` is gitignored. When the key is absent, SkiAPI-backed resorts
(Heavenly, Kirkwood, Boreal, Diamond Peak) skip their request and the card
simply omits the resort report — weather and free sources keep working.

### 3. Use in Components

```typescript
import { resortAPIService } from '../services/resortAPIs';

// Get data for any resort
const resortData = await resortAPIService.getResortData('Heavenly');

if (resortData) {
  console.log(`Fresh snow: ${resortData.freshSnow24h}cm`);
  console.log(`Lifts open: ${resortData.liftsOpen}/${resortData.liftsTotal}`);
  console.log(`Source: ${resortData.source}`);
}
```

## 🔄 Integration with Existing App

You can integrate this with your existing `ResortCard` component:

1. Import the resort API service
2. Add a toggle to switch between weather data and resort data
3. Display resort-specific information when available
4. Fall back to weather data when resort APIs aren't available

## 🎯 Benefits of Direct Resort APIs

### vs Weather APIs:

- ✅ **Lift Status**: Real-time lift operations
- ✅ **Trail Counts**: Open vs total trails
- ✅ **Snow Reports**: Resort-verified snow conditions
- ✅ **Official Data**: Direct from resort operations

### vs Paid Services:

- ✅ **Cost**: Completely free options available
- ✅ **No Usage Limits**: Weather stations and public feeds
- ✅ **Real-time**: Direct from resort systems

## 🚨 Important Notes

### Rate Limiting:

- SkiAPI free tier: 500 requests/month
- Weather stations: Usually no limits
- Public scraping: Be respectful, cache data

### CORS Issues:

- Some resort APIs may have CORS restrictions
- Use a backend proxy if needed
- Weather stations often allow direct access

### Data Reliability:

- Resort APIs are most accurate for operational data
- Weather APIs better for forecasts
- Combine both for comprehensive coverage

## 📈 Next Steps

1. **Start Simple**: Begin with SkiAPI for a few resorts
2. **Add Weather Stations**: Integrate public weather feeds
3. **Expand Coverage**: Add resort-specific APIs
4. **Optimize**: Cache data, handle errors gracefully
5. **Enhance UI**: Show data source, update frequency

## 💡 Pro Tips

- Cache API responses to reduce calls
- Show data source to users for transparency
- Combine with your existing weather data for complete picture
- Set up monitoring for API availability
- Consider backend integration for production apps

## 🔗 Useful Links

- [RapidAPI SkiAPI](https://rapidapi.com/ski-api/api/ski-api/)
- [Open-Meteo Weather API](https://open-meteo.com/) (your current source)
- [Resort websites](/) - Many have public JSON endpoints
