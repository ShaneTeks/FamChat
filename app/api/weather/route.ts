export const maxDuration = 30

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

    // Call WeatherAPI.com current weather endpoint
    const weatherResponse = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${encodeURIComponent(location)}&aqi=no`,
      { method: "GET" }
    )

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text()
      console.error("Weather API error:", errorText)
      return Response.json(
        { error: "Failed to fetch weather data" },
        { status: weatherResponse.status }
      )
    }

    const data = await weatherResponse.json()

    // Map weather condition to appropriate icon and gradient
    const condition = data.current.condition.text.toLowerCase()
    let conditionImage = "https://cdn.openai.com/API/storybook/mostly-sunny.png"
    let background = "linear-gradient(111deg, #1769C8 0%, #258AE3 56.92%, #31A3F8 100%)"

    if (condition.includes("sun") || condition.includes("clear")) {
      conditionImage = "https://cdn.openai.com/API/storybook/mostly-sunny.png"
      background = "linear-gradient(111deg, #1769C8 0%, #258AE3 56.92%, #31A3F8 100%)"
    } else if (condition.includes("cloud") || condition.includes("overcast")) {
      conditionImage = "https://cdn.openai.com/API/storybook/cloudy.png"
      background = "linear-gradient(111deg, #5F6C7B 0%, #798796 56.92%, #9BA5B0 100%)"
    } else if (condition.includes("rain") || condition.includes("drizzle")) {
      conditionImage = "https://cdn.openai.com/API/storybook/rainy.png"
      background = "linear-gradient(111deg, #1F3A57 0%, #2E5984 56.92%, #4682B4 100%)"
    } else if (condition.includes("snow") || condition.includes("sleet")) {
      conditionImage = "https://cdn.openai.com/API/storybook/snowy.png"
      background = "linear-gradient(111deg, #B8C5D6 0%, #D4E0EE 56.92%, #F0F5FA 100%)"
    }

    // Format the response (metric units: Celsius and km/h)
    const weatherData = {
      location: data.location.name,
      country: data.location.country,
      temperature: `${Math.round(data.current.temp_c)}°`,
      condition: data.current.condition.text,
      humidity: data.current.humidity,
      windKph: `${Math.round(data.current.wind_kph)} km/h`,
      feelsLike: `${Math.round(data.current.feelslike_c)}°`,
      conditionImage,
      background,
    }

    return Response.json(weatherData)
  } catch (error) {
    console.error("Error fetching weather:", error)
    return Response.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    )
  }
}
