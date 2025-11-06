export const maxDuration = 30

// Helper function to map weather conditions to icons
function getConditionImage(condition: string): string {
  const conditionLower = condition.toLowerCase()
  
  if (conditionLower.includes("sun") || conditionLower.includes("clear")) {
    return "https://cdn.openai.com/API/storybook/mostly-sunny.png"
  } else if (conditionLower.includes("partly cloudy") || conditionLower.includes("mixed")) {
    return "https://cdn.openai.com/API/storybook/mixed-sun.png"
  } else if (conditionLower.includes("cloud") || conditionLower.includes("overcast")) {
    return "https://cdn.openai.com/API/storybook/cloudy.png"
  } else if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) {
    return "https://cdn.openai.com/API/storybook/rain.png"
  } else if (conditionLower.includes("snow") || conditionLower.includes("sleet")) {
    return "https://cdn.openai.com/API/storybook/snowy.png"
  } else if (conditionLower.includes("wind")) {
    return "https://cdn.openai.com/API/storybook/windy.png"
  } else if (conditionLower.includes("storm") || conditionLower.includes("thunder")) {
    return "https://cdn.openai.com/API/storybook/rainy.png"
  }
  
  return "https://cdn.openai.com/API/storybook/mostly-sunny.png"
}

// Helper function to get background gradient based on condition
function getBackground(condition: string): string {
  const conditionLower = condition.toLowerCase()
  
  if (conditionLower.includes("sun") || conditionLower.includes("clear")) {
    return "linear-gradient(111deg, #1769C8 0%, #258AE3 56.92%, #31A3F8 100%)"
  } else if (conditionLower.includes("cloud") || conditionLower.includes("overcast")) {
    return "linear-gradient(111deg, #5F6C7B 0%, #798796 56.92%, #9BA5B0 100%)"
  } else if (conditionLower.includes("rain") || conditionLower.includes("drizzle") || conditionLower.includes("storm")) {
    return "linear-gradient(111deg, #1F3A57 0%, #2E5984 56.92%, #4682B4 100%)"
  } else if (conditionLower.includes("snow") || conditionLower.includes("sleet")) {
    return "linear-gradient(111deg, #B8C5D6 0%, #D4E0EE 56.92%, #F0F5FA 100%)"
  }
  
  return "linear-gradient(111deg, #1769C8 0%, #258AE3 56.92%, #31A3F8 100%)"
}

export async function POST(req: Request) {
  if (!process.env.WEATHER_API_KEY) {
    return Response.json(
      { error: "Weather API key not configured" },
      { status: 500 }
    )
  }

  try {
    const { location } = await req.json()

    if (!location) {
      return Response.json(
        { error: "Location is required" },
        { status: 400 }
      )
    }

    // Call WeatherAPI.com forecast endpoint for 5 days
    const forecastResponse = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(location)}&days=5&aqi=no`,
      { method: "GET" }
    )

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text()
      console.error("Weather forecast API error:", errorText)
      return Response.json(
        { error: "Failed to fetch weather forecast data" },
        { status: forecastResponse.status }
      )
    }

    const data = await forecastResponse.json()
    
    // Get today's data for current conditions
    const current = data.current
    const today = data.forecast.forecastday[0].day
    
    // Format forecast array (5 days)
    const forecast = data.forecast.forecastday.map((day: any) => ({
      conditionImage: getConditionImage(day.day.condition.text),
      temperature: `${Math.round(day.day.avgtemp_c)}°`,
    }))

    // Format the response according to the widget schema
    const forecastData = {
      background: getBackground(current.condition.text),
      conditionImage: getConditionImage(current.condition.text),
      lowTemperature: `${Math.round(today.mintemp_c)}°`,
      highTemperature: `${Math.round(today.maxtemp_c)}°`,
      location: `${data.location.name}, ${data.location.country}`,
      conditionDescription: current.condition.text,
      forecast: forecast,
      // Additional data for natural language response
      windSpeed: `${Math.round(current.wind_kph)} km/h`,
      humidity: `${current.humidity}%`,
    }

    return Response.json(forecastData)
  } catch (error) {
    console.error("Error fetching weather forecast:", error)
    return Response.json(
      { error: "Failed to fetch weather forecast data" },
      { status: 500 }
    )
  }
}
