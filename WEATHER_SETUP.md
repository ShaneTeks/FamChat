# Weather Widget Setup Guide

This document explains how to set up the real-time weather widget feature powered by WeatherAPI.com.

## Getting Your API Key

1. Visit [WeatherAPI.com](https://www.weatherapi.com/)
2. Sign up for a free account
3. Navigate to your dashboard and copy your API key
4. The free tier includes 1 million calls/month which is more than enough for personal use

## Configuration

1. Add your API key to your `.env.local` file:
```bash
WEATHER_API_KEY=your_api_key_here
```

2. Restart your development server:
```bash
npm run dev
```

## How It Works

### Architecture

1. **User Request**: User asks about weather for a location (e.g., "What's the weather in London?")

2. **AI Tool Calling**: The AI recognizes this as a weather query and calls the `getCurrentWeather` tool

3. **Weather API Route** (`/api/weather`): 
   - Receives the location from the AI
   - Calls WeatherAPI.com to fetch real-time data
   - Maps weather conditions to appropriate icons and gradients
   - Returns structured weather data

4. **AI Response**: The AI receives the weather data and formats it as a JSON response

5. **Widget Rendering**: The frontend detects the weather JSON and renders a beautiful weather widget

### Files Modified

- `/app/api/weather/route.ts` - Weather API endpoint
- `/app/api/chat/route.ts` - Added tool calling for weather
- `/components/weather-widget.tsx` - Widget component (already created)
- `/.env.example` - Added WEATHER_API_KEY documentation

## Weather Widget Features

- **Real-time Data**: Current temperature, conditions, humidity, wind speed
- **Smart Icons**: Automatically selects appropriate weather icons (sunny, cloudy, rainy, snowy)
- **Beautiful Gradients**: Background colors that match weather conditions
- **Responsive Design**: Works on all screen sizes
- **Animated**: Smooth scale-in animation when widget appears

## Testing

Try asking your AI:
- "What's the weather in Tokyo?"
- "How's the weather in New York City?"
- "Tell me the current weather in Paris"
- "Is it raining in London?"

The AI will automatically fetch real weather data and display it in a widget!

## API Response Format

The weather API returns:
```json
{
  "location": "Tokyo",
  "country": "Japan",
  "temperature": "15°",
  "temperatureF": "59°F",
  "condition": "Partly cloudy",
  "humidity": 65,
  "windKph": 12,
  "windMph": 7.5,
  "feelsLikeC": 13,
  "feelsLikeF": 55,
  "conditionImage": "https://cdn.openai.com/API/storybook/cloudy.png",
  "background": "linear-gradient(111deg, #5F6C7B 0%, #798796 56.92%, #9BA5B0 100%)"
}
```

## Troubleshooting

### "Weather API key not configured" error
- Make sure `WEATHER_API_KEY` is in your `.env.local` file
- Restart your development server after adding the key

### Widget not appearing
- Check browser console for errors
- Verify the AI is returning JSON in the correct format
- Make sure the frontend can extract JSON from the AI response

### "Failed to fetch weather data" error
- Check that your API key is valid
- Verify you haven't exceeded your API rate limit
- Ensure the location name is valid

## Rate Limits

WeatherAPI.com free tier:
- 1 million calls per month
- ~32,000 calls per day
- No credit card required

This is plenty for personal/family use!
