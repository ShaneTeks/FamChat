import { streamText, generateText, consumeStream, CoreMessage, CoreToolMessage } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"

export const maxDuration = 30

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return new Response("Missing Groq API key", { status: 500 })
  }

  let body: unknown

  try {
    body = await req.json()
  } catch (error) {
    return new Response("Invalid JSON body", { status: 400 })
  }

  console.log("Received body:", JSON.stringify(body))

  if (!body || typeof body !== "object") {
    return new Response("Invalid request body", { status: 400 })
  }

  const { messages, systemInstruction } = body as { 
    messages?: Array<{ role: string; content: string }>
    systemInstruction?: string
  }

  console.log("Extracted messages:", messages)

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response("No messages provided", { status: 400 })
  }

  // Use custom system instruction if provided, otherwise use default
  const baseInstruction = systemInstruction || 'You are a helpful AI assistant.'
  
  // Add image generation and weather capabilities to the system message
  const systemMessage = `${baseInstruction}

You have the following special abilities:

1. IMAGE GENERATION: When a user asks you to create, generate, or draw an image, respond with:
{
  "type": "image",
  "prompt": "detailed description of the image",
  "message": "your response to the user"
}

2. CURRENT WEATHER: When a user asks about current weather, weather conditions, or "what's the weather" for ANY location, you MUST call the getCurrentWeather tool. Do not make up weather data. Always use the tool.
   - Keywords: "weather", "temperature", "conditions", "how's the weather", "what's it like in"
   - ALWAYS call the tool, even if you think you know the answer

3. WEATHER FORECAST: When a user asks about future weather, forecast, or weather for multiple days, you MUST call the getWeatherForecast tool. Do not make up forecast data. Always use the tool.
   - Keywords: "forecast", "next few days", "this week", "upcoming weather", "5 day"
   - ALWAYS call the tool, even if you think you know the answer

CRITICAL: All temperatures are in Celsius and wind speeds are in km/h (metric system).
CRITICAL: You have access to real-time weather tools - ALWAYS use them when weather is mentioned.

For normal conversations without special requests, just respond naturally with text.`

  // Define tools for the AI
  const tools = {
    getCurrentWeather: {
      description: 'REQUIRED: Get the current weather for a location. You MUST call this tool whenever a user asks about weather, temperature, or conditions for any location. Do not respond without calling this tool first.',
      inputSchema: z.object({
        location: z.string().describe('The city name or location to get weather for'),
      }),
      execute: async ({ location }: { location: string }) => {
        try {
          console.log('getCurrentWeather tool called with location:', location)
          const response = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/weather`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location }),
          })
          
          if (!response.ok) {
            console.error('Weather API error:', response.status)
            return { error: 'Could not fetch weather data' }
          }
          
          const data = await response.json()
          console.log('Tool returning weather data:', data)
          return data
        } catch (error) {
          console.error('Weather tool error:', error)
          return { error: 'Failed to fetch weather' }
        }
      },
    },
    getWeatherForecast: {
      description: 'REQUIRED: Get a 5-day weather forecast for a location. You MUST call this tool whenever a user asks about future weather, forecast, or weather for multiple days. Do not respond without calling this tool first.',
      inputSchema: z.object({
        location: z.string().describe('The city name or location to get the forecast for'),
      }),
      execute: async ({ location }: { location: string }) => {
        try {
          console.log('getWeatherForecast tool called with location:', location)
          const response = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/weather-forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location }),
          })
          
          if (!response.ok) {
            console.error('Weather forecast API error:', response.status)
            return { error: 'Could not fetch weather forecast data' }
          }
          
          const data = await response.json()
          console.log('Tool returning forecast data:', data)
          return data
        } catch (error) {
          console.error('Weather forecast tool error:', error)
          return { error: 'Failed to fetch weather forecast' }
        }
      },
    },
  }

  console.log('Starting with tools')
  
  // Initial conversation
  let conversationMessages: CoreMessage[] = messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }))

  // First call using generateText (non-streaming) to check for tool calls
  const initialResult = await generateText({
    model: groqClient("moonshotai/kimi-k2-instruct-0905"),
    system: systemMessage,
    messages: conversationMessages,
    tools,
    maxOutputTokens: 2000,
    temperature: 0.7,
  })

  console.log('=== First Call Finished ===')
  console.log('Finish reason:', initialResult.finishReason)
  console.log('Tool calls:', initialResult.toolCalls?.length || 0)

  // If weather tool was called, format the response directly
  if (initialResult.finishReason === 'tool-calls' && initialResult.toolResults && initialResult.toolResults.length > 0) {
    console.log('Tool was called, formatting response...')
    console.log('Tool results:', JSON.stringify(initialResult.toolResults, null, 2))
    
    // Check if it was a current weather tool call
    const weatherResult = initialResult.toolResults.find((tr: any) => tr.toolName === 'getCurrentWeather')
    
    if (weatherResult) {
      const weatherData = (weatherResult as any).output
      console.log('Current weather data:', weatherData)
      
      // Format the weather widget JSON response
      const weatherResponse = {
        type: 'weather',
        message: `The current weather in ${weatherData.location}, ${weatherData.country} is ${weatherData.condition}. It's ${weatherData.temperature} with ${weatherData.humidity}% humidity and winds at ${weatherData.windKph}.`,
        weatherData: {
          location: weatherData.location,
          background: weatherData.background,
          conditionImage: weatherData.conditionImage,
          conditionDescription: weatherData.condition,
          temperature: weatherData.temperature,
        }
      }
      
      console.log('Returning weather widget response')
      
      // Return a streaming response with the weather JSON
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const jsonStr = JSON.stringify(weatherResponse)
          controller.enqueue(encoder.encode(`0:${JSON.stringify({ type: 'text-delta', textDelta: jsonStr })}\n`))
          controller.close()
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1',
        },
      })
    }
    
    // Check if it was a forecast tool call
    const forecastResult = initialResult.toolResults.find((tr: any) => tr.toolName === 'getWeatherForecast')
    
    if (forecastResult) {
      const forecastData = (forecastResult as any).output
      console.log('Forecast data:', forecastData)
      
      // Format the forecast widget JSON response
      const forecastResponse = {
        type: 'forecast',
        message: `Here's the 5-day forecast for ${forecastData.location}. Today's temperature ranges from ${forecastData.lowTemperature} to ${forecastData.highTemperature} with ${forecastData.conditionDescription}. Wind speed: ${forecastData.windSpeed}, Humidity: ${forecastData.humidity}.`,
        forecastData: {
          background: forecastData.background,
          conditionImage: forecastData.conditionImage,
          lowTemperature: forecastData.lowTemperature,
          highTemperature: forecastData.highTemperature,
          location: forecastData.location,
          conditionDescription: forecastData.conditionDescription,
          forecast: forecastData.forecast,
        }
      }
      
      console.log('Returning forecast widget response')
      
      // Return a streaming response with the forecast JSON
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const jsonStr = JSON.stringify(forecastResponse)
          controller.enqueue(encoder.encode(`0:${JSON.stringify({ type: 'text-delta', textDelta: jsonStr })}\n`))
          controller.close()
        }
      })
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1',
        },
      })
    }
  }

  // No tools were called, stream the initial response
  console.log('No tools called, streaming initial response')
  const streamResult = streamText({
    model: groqClient("moonshotai/kimi-k2-instruct-0905"),
    system: systemMessage,
    messages: conversationMessages,
    tools,
    maxOutputTokens: 2000,
    temperature: 0.7,
  })
  
  return streamResult.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}
