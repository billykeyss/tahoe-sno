# TahoeSno - Lake Tahoe Ski Resort Dashboard

A comprehensive ski conditions dashboard for Lake Tahoe resorts with real-time weather data, avalanche conditions, and travel information.

Built with React Router 7, TypeScript, and Nx in a single-project configuration.

## Features

- **Resort Weather**: Real-time conditions for 10 Lake Tahoe ski resorts
- **Snow Data**: 24-hour fresh snow, 7-day totals, base/summit depths
- **5-Day Forecast**: Weather icons and snow predictions
- **Historical Snow**: 7-day snowfall chart visualization
- **Avalanche Danger**: Sierra Avalanche Center danger ratings and problems
- **Chain Controls**: I-80, US-50, SR-89 chain requirement status
- **Auto-refresh**: Data updates every 15-60 minutes

## API Setup

### Primary APIs (No Keys Required - FREE!)

- **Open-Meteo**: Primary weather API for all resort data
- **Sierra Avalanche Center**: RSS feed for avalanche conditions
- **Caltrans QuickMap**: JSON API for chain control status

### Optional: WeatherUnlocked (Premium Weather Data)

If you want enhanced ski-specific data (base depths, lift status), you can optionally add WeatherUnlocked:

1. Sign up at [WeatherUnlocked Developer Portal](https://developer.weatherunlocked.com/)
2. Get your App ID and App Key
3. Create `.env` file in the root:

```
VITE_WEATHER_UNLOCKED_APP_ID=your_app_id_here
VITE_WEATHER_UNLOCKED_APP_KEY=your_app_key_here
```

**Note**: The app works great without any API keys using Open-Meteo!

## Development

```bash
# Install dependencies
npm install

# Start development server (no API keys needed!)
npm run dev

# Build for production
npm run build

# Preview production build
npm run start

# Run tests
npm run test

# Lint code
npm run lint
```

## Deployment on Render

### Via Render Dashboard:

1. **Connect Repository**:

   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**:

   - **Name**: `TahoeSno` (or your preferred name)
   - **Branch**: `main`
   - **Root Directory**: Leave empty (uses root)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
   - **Publish Directory**: `build` (React Router 7 builds to build/ directory)

3. **Environment Variables** (optional):

   - Add `VITE_WEATHER_UNLOCKED_APP_ID` if you have WeatherUnlocked keys
   - Add `VITE_WEATHER_UNLOCKED_APP_KEY` if you have WeatherUnlocked keys

4. **Advanced Settings**:
   - **Node Version**: `18` or `20`
   - **Auto-Deploy**: `Yes`

### Via render.yaml (Infrastructure as Code):

Create a `render.yaml` file in your root directory:

```yaml
services:
  - type: web
    name: TahoeSno
    runtime: node
    plan: free
    buildCommand: npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_VERSION
        value: '20'
```

## Project Structure

```
/
├── app/                    # React Router 7 app source
│   ├── components/         # React components
│   ├── services/          # API client and services
│   └── routes/            # React Router 7 routes
├── public/                # Static assets
├── build/                 # Production build output
├── dist/                  # Alternative build output (unused)
├── tests/                 # Test files
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── react-router.config.ts # React Router 7 configuration
└── project.json           # Nx project configuration
```

## Resort Coverage

- Palisades Tahoe (39.1969, -120.2357)
- Alpine Meadows (39.1566, -120.2269)
- Northstar California (39.2734, -120.1218)
- Heavenly (38.9359, -119.9391)
- Kirkwood (38.6867, -120.0658)
- Sierra-at-Tahoe (38.7928, -120.0908)
- Homewood (39.0831, -120.1664)
- Diamond Peak (39.2549, -119.9230)
- Mt Rose (39.3181, -119.8862)
- Sugar Bowl (39.3016, -120.3663)

## Data Sources

- **Weather**: Open-Meteo API (free, reliable, CORS-friendly)
- **Avalanche**: Sierra Avalanche Center RSS (updates 6AM daily)
- **Travel**: Caltrans QuickMap JSON (updates every 15 minutes)
- **Coordinates**: Accurate lat/lon for each resort

## Architecture

- **Frontend**: React 19 + TypeScript + React Router 7
- **API Client**: Centralized `apiClient.ts` with error handling
- **Styling**: Modern glassmorphism design with CSS modules
- **Build**: Nx single-project with Vite and React Router 7
- **SSR**: Server-side rendering enabled

## Error Handling

The app gracefully handles API failures:

- Open-Meteo → Mock data fallback if needed
- Network errors → Mock data with error indicators
- Loading states with shimmer animations
- CORS-friendly APIs for development
