# Weather Forecast Feature

## Overview
Implemented 5-day weather forecast widget that displays alongside the existing current weather widget in Raimond chat.

## Features

### 1. **5-Day Weather Forecast Widget**
- Displays current day's high/low temperatures
- Shows forecast for 5 days with icons and temperatures
- Automatically uses weather condition icons (sunny, cloudy, rainy, snowy, windy, etc.)
- Dynamic background gradient based on weather conditions
- All temperatures in **Celsius (°C)**
- All wind speeds in **metric (km/h)**

### 2. **AI Assistant Integration**
The AI assistant can now respond to forecast requests like:
- "What's the forecast for Paris?"
- "Show me the weather for the next 5 days in Tokyo"
- "What will the weather be like in London this week?"

## Files Created

### API Endpoints
- **`/app/api/weather-forecast/route.ts`** - New API endpoint that calls WeatherAPI.com's forecast endpoint
  - Returns 5-day forecast data
  - Maps weather conditions to appropriate icons
  - Uses metric units (Celsius, km/h)

### Components
- **`/components/forecast-widget.tsx`** - New widget component for displaying 5-day forecast
  - Shows main condition icon
  - Displays high/low temperature range
  - Location and condition description
  - 5-day forecast strip with icons and temperatures

### Type Definitions
- **`/lib/types.ts`** - Added new types:
  - `ForecastItem` - Individual day forecast
  - `ForecastWidget` - Complete forecast widget data
  - Updated `Message` interface to include `forecastWidget` property

## Files Modified

### Chat System
- **`/app/api/chat/route.ts`**
  - Added `getWeatherForecast` tool for AI to call
  - Updated system instructions to include forecast capability
  - Added forecast response handler
  - Updated weather response to use metric units only

- **`/components/chat-interface.tsx`**
  - Added forecast request detection in stream handlers
  - Added forecast widget data processing
  - Handles forecast JSON responses from API

- **`/components/chat-message.tsx`**
  - Imported `ForecastWidget` component
  - Added rendering for forecast widget in messages

### Current Weather API
- **`/app/api/weather/route.ts`**
  - Updated to use **Celsius only** (removed Fahrenheit)
  - Wind speed now in **km/h** with formatted string
  - Removed imperial units from response

## Widget Schema
The forecast widget follows the schema provided:

```typescript
{
  background: string,              // CSS gradient for widget background
  conditionImage: string,          // URL to main weather condition icon
  lowTemperature: string,          // Today's low (e.g., "18°")
  highTemperature: string,         // Today's high (e.g., "25°")
  location: string,                // "City, Country"
  conditionDescription: string,    // Human-readable condition
  forecast: [                      // Array of 5 days
    {
      conditionImage: string,      // Icon URL for the day
      temperature: string          // Average temp for the day
    }
  ]
}
```

## Usage Examples

**User:** "What's the forecast for New York?"

**AI Response:** Displays a 5-day forecast widget with:
- Current day's high/low temperatures
- Main weather icon and condition
- 5-day strip showing upcoming weather
- All temperatures in Celsius
- Wind speed in km/h

## Weather Condition Icons
The system maps weather conditions to appropriate icons:
- **Sunny/Clear** → `mostly-sunny.png`
- **Partly Cloudy** → `mixed-sun.png`
- **Cloudy/Overcast** → `cloudy.png`
- **Rain/Drizzle** → `rain.png`
- **Snow/Sleet** → `snowy.png`
- **Windy** → `windy.png`
- **Storm/Thunder** → `rainy.png`

## Metric System
All weather data uses the metric system:
- **Temperatures**: Celsius (°C)
- **Wind Speed**: Kilometers per hour (km/h)
- **Distance**: Meters/Kilometers

## Technical Notes

### API Integration
- Uses WeatherAPI.com's forecast endpoint (`/v1/forecast.json`)
- Fetches 5 days of forecast data
- Requires `WEATHER_API_KEY` environment variable

### Widget Rendering
- Widgets are displayed below the chat message text
- Animated scale-in effect when appearing
- Responsive design works on all screen sizes
- Maintains Raimond's custom color scheme

### Data Flow
1. User asks for forecast
2. AI calls `getWeatherForecast` tool with location
3. API fetches data from WeatherAPI.com
4. Response formatted to widget schema
5. Chat interface detects forecast type
6. Widget rendered in chat message

## Future Enhancements
Potential improvements:
- Hourly forecast view
- Weather alerts and warnings
- Precipitation probability
- UV index
- Air quality data
- Multiple location comparison
