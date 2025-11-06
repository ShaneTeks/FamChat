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

  // Get authorization header for forwarding to Spotify APIs
  const authHeader = req.headers.get('authorization')

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

4. SPOTIFY INTEGRATION: You have access to Spotify tools for music control:
   - searchSpotify: Search for tracks, albums, or playlists on Spotify (works without user auth)
   - getCurrentlyPlaying: Get the currently playing track (requires Spotify connection)
   - getSpotifyDevices: List available Spotify devices (requires Spotify connection)
   - playSpotify: Start or resume playback (requires Spotify connection)
   
   CRITICAL SPOTIFY INSTRUCTIONS:
   1. NEVER claim you have played music without actually calling the playSpotify tool
   2. WORKFLOW for playing music (FIRST TIME in conversation):
      a. Call getSpotifyDevices (takes NO parameters) to check available devices
      b. If no devices found, tell user to open Spotify on a device first
      c. If devices found, ask user which device to use
      d. Once user specifies device, call searchSpotify to find the track
      e. Finally call playSpotify with the track URI and device ID
   3. WORKFLOW for subsequent song requests in SAME conversation:
      a. User already picked a device, so SKIP getSpotifyDevices
      b. Just call searchSpotify to find the new track
      c. Call playSpotify with the same device_id from before
   4. When playing a track, use the "uris" parameter (array), NOT "context_uri"
   5. After calling playSpotify, wait for the tool result before confirming to the user
   6. If playSpotify returns "No active device found", tell user to open Spotify and start playing something first
   
   If any Spotify tool returns error "SPOTIFY_NOT_CONNECTED", respond EXACTLY with:
   "To control Spotify playback, you need to connect your Spotify account first. Please open Settings (⚙️ gear icon in the sidebar) and click 'Connect Spotify' under Spotify Integration."
   
   Be polite and helpful in explaining that this is a one-time setup.
   
   When asked to display or show a Spotify playlist, respond with:
{
  "type": "spotify",
  "playlistId": "the_playlist_id",
  "message": "your response to the user"
}

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
    searchSpotify: {
      description: 'Search for music on Spotify. Returns tracks, albums, and artists matching the search query.',
      inputSchema: z.object({
        query: z.string().describe('The search query (song name, artist, album, etc.)'),
        type: z.string().optional().describe('Type of results to return: track, album, artist, or comma-separated combination. Default: track,album,artist'),
        limit: z.number().optional().describe('Maximum number of results to return (1-50). Default: 20'),
      }),
      execute: async ({ query, type, limit }: { query: string; type?: string; limit?: number }) => {
        try {
          console.log('searchSpotify tool called with query:', query)
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (authHeader) headers['Authorization'] = authHeader
          
          const response = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/spotify-search`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, type: type || 'track,album,artist', limit: limit || 20 }),
          })
          
          if (!response.ok) {
            console.error('Spotify search API error:', response.status)
            return { error: 'Could not search Spotify' }
          }
          
          const data = await response.json()
          console.log('Tool returning Spotify search data')
          return data
        } catch (error) {
          console.error('Spotify search tool error:', error)
          return { error: 'Failed to search Spotify' }
        }
      },
    },
    getCurrentlyPlaying: {
      description: 'Get the currently playing track on Spotify.',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log('getCurrentlyPlaying tool called')
          const headers: Record<string, string> = {}
          if (authHeader) headers['Authorization'] = authHeader
          
          const response = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/spotify-current`, {
            method: 'GET',
            headers,
          })
          
          if (!response.ok) {
            console.error('Spotify current API error:', response.status)
            return { error: 'Could not get currently playing track' }
          }
          
          const data = await response.json()
          console.log('Tool returning currently playing data')
          return data
        } catch (error) {
          console.error('Currently playing tool error:', error)
          return { error: 'Failed to get currently playing track' }
        }
      },
    },
    getSpotifyDevices: {
      description: 'Get a list of available Spotify devices for playback.',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          console.log('getSpotifyDevices tool called')
          const headers: Record<string, string> = {}
          if (authHeader) headers['Authorization'] = authHeader
          
          const response = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/spotify-devices`, {
            method: 'GET',
            headers,
          })
          
          if (!response.ok) {
            console.error('Spotify devices API error:', response.status)
            const errorData = await response.json().catch(() => ({}))
            
            // Return the specific error with details for the frontend to handle
            if (errorData.error === 'SPOTIFY_NOT_CONNECTED') {
              return {
                error: 'SPOTIFY_NOT_CONNECTED',
                message: errorData.message || 'Please connect your Spotify account',
                requiresSpotifyAuth: true
              }
            }
            
            return { error: 'Could not get Spotify devices' }
          }
          
          const data = await response.json()
          console.log('Tool returning devices data')
          return data
        } catch (error) {
          console.error('Spotify devices tool error:', error)
          return { error: 'Failed to get Spotify devices' }
        }
      },
    },
    playSpotify: {
      description: 'Start or resume playback on Spotify. IMPORTANT: You MUST call this tool to actually play music - do not just say you played it without calling the tool! For individual tracks, use uris array. For albums/playlists, use context_uri.',
      inputSchema: z.object({
        context_uri: z.string().optional().describe('Spotify URI for album, artist, or playlist. Example: spotify:album:5ht7ItJgpBH7W6vJ5BqpPr. DO NOT use for individual tracks - use uris instead.'),
        uris: z.array(z.string()).optional().describe('Array of track URIs to play individual songs. Example: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"]. Use this for playing specific tracks, NOT context_uri.'),
        offset: z.object({
          position: z.number().optional(),
          uri: z.string().optional(),
        }).optional().describe('Starting position in context'),
        position_ms: z.number().optional().describe('Position in milliseconds to start playback'),
        device_id: z.string().optional().describe('The device ID (long alphanumeric string like "54feadf5e63a93c9fef2d6697d7dba3d64c6b61c") from getSpotifyDevices. DO NOT use the device name. If not specified, plays on currently active device'),
      }),
      execute: async (params: any) => {
        try {
          console.log('playSpotify tool called with params:', params)
          
          // Fix: If context_uri is a track, move it to uris array
          if (params.context_uri && params.context_uri.includes('spotify:track:')) {
            console.log('⚠️ AUTO-FIX: Converting track context_uri to uris array')
            console.log('   Before:', JSON.stringify(params))
            params.uris = [params.context_uri]
            delete params.context_uri
            console.log('   After:', JSON.stringify(params))
          }
          
          // If device_id looks like a device name (not a long alphanumeric ID), try to resolve it
          if (params.device_id && params.device_id.length < 30) {
            console.log('Device ID looks like a name, fetching devices to resolve...')
            try {
              const devicesHeaders: Record<string, string> = {}
              if (authHeader) devicesHeaders['Authorization'] = authHeader
              
              const devicesResponse = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/spotify-devices`, {
                method: 'GET',
                headers: devicesHeaders,
              })
              
              if (devicesResponse.ok) {
                const devicesData = await devicesResponse.json()
                const matchedDevice = devicesData.devices?.find((d: any) => 
                  d.name.toLowerCase() === params.device_id.toLowerCase() ||
                  d.name.toLowerCase().includes(params.device_id.toLowerCase()) ||
                  params.device_id.toLowerCase().includes(d.name.toLowerCase())
                )
                
                if (matchedDevice) {
                  console.log(`Resolved device name "${params.device_id}" to ID "${matchedDevice.id}"`)
                  params.device_id = matchedDevice.id
                } else {
                  console.warn(`Could not find device matching "${params.device_id}"`)
                }
              }
            } catch (e) {
              console.error('Failed to resolve device name:', e)
            }
          }
          
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (authHeader) headers['Authorization'] = authHeader
          
          const response = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/spotify-play`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(params),
          })
          
          if (!response.ok) {
            console.error('Spotify play API error:', response.status)
            try {
              const errorData = await response.json()
              console.error('Spotify API error:', errorData)
              
              // Check for NO_ACTIVE_DEVICE error
              if (errorData.error?.reason === 'NO_ACTIVE_DEVICE') {
                return { 
                  error: 'NO_ACTIVE_DEVICE',
                  message: 'No active Spotify device found. Please open Spotify on a device and start playing something first, then try again.'
                }
              }
              
              return { error: errorData.error?.message || 'Could not start playback' }
            } catch (e) {
              return { error: 'Could not start playback' }
            }
          }
          
          const data = await response.json()
          console.log('Tool returning play response')
          return data
        } catch (error) {
          console.error('Spotify play tool error:', error)
          return { error: 'Failed to start playback' }
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
    model: groqClient("openai/gpt-oss-120b"),
    system: systemMessage,
    messages: conversationMessages,
    tools,
    maxOutputTokens: 2000,
    temperature: 0.7,
  })

  console.log('=== First Call Finished ===')
  console.log('Finish reason:', initialResult.finishReason)
  console.log('Tool calls:', initialResult.toolCalls?.length || 0)

  // If tools were called, handle the results
  if (initialResult.finishReason === 'tool-calls' && initialResult.toolResults && initialResult.toolResults.length > 0) {
    console.log('Tool was called, formatting response...')
    console.log('Tool results:', JSON.stringify(initialResult.toolResults, null, 2))
    
    // Check if it was a Spotify tool call
    const spotifyResult = initialResult.toolResults.find((tr: any) => 
      ['getSpotifyDevices', 'getCurrentlyPlaying', 'searchSpotify', 'playSpotify'].includes(tr.toolName)
    )
    
    // If Spotify tool was called, continue conversation with results
    if (spotifyResult) {
      console.log('Spotify tool called, continuing conversation with results')
      
      // Add the tool results to conversation
      conversationMessages.push({
        role: 'assistant',
        content: initialResult.text || '',
      })
      
      // Format devices or other Spotify data into readable text
      const spotifyData = spotifyResult.output
      let contextMessage = ''
      
      if (spotifyResult.toolName === 'getSpotifyDevices') {
        if (spotifyData.devices && spotifyData.devices.length > 0) {
          const deviceList = spotifyData.devices.map((d: any, i: number) => 
            `${i + 1}. ${d.name} (${d.type}) - ID: ${d.id}`
          ).join('\n')
          contextMessage = `I found ${spotifyData.devices.length} Spotify devices:\n${deviceList}\n\nIMPORTANT: When calling playSpotify, you MUST use the device's ID field (the long alphanumeric string), NOT the name. Tell the user about these devices and ask which one they'd like to use.`
        } else {
          contextMessage = 'No Spotify devices found. Tell the user to open Spotify on a device first.'
        }
      } else if (spotifyResult.toolName === 'searchSpotify') {
        if (spotifyData.tracks && spotifyData.tracks.items && spotifyData.tracks.items.length > 0) {
          const topTrack = spotifyData.tracks.items[0]
          contextMessage = `Found: "${topTrack.name}" by ${topTrack.artists.map((a: any) => a.name).join(', ')}\nURI: ${topTrack.uri}\n\nIMPORTANT: Now call playSpotify with uris: ["${topTrack.uri}"] to play this track. Tell the user you're playing it.`
        } else {
          contextMessage = 'No tracks found. Tell the user you could not find that song.'
        }
      } else {
        // For other tools, just tell AI to respond naturally
        contextMessage = 'Respond naturally to the user based on the tool result.'
      }
      
      conversationMessages.push({
        role: 'user',
        content: contextMessage,
      })
      
      // Stream the final response with tool results
      console.log('Streaming Spotify response with formatted context:', contextMessage)
      const spotifyStreamResult = streamText({
        model: groqClient("openai/gpt-oss-120b"),
        system: systemMessage,
        messages: conversationMessages,
        tools, // Include tools so AI can continue using them
        maxOutputTokens: 2000,
        temperature: 0.7,
      })
      
      return spotifyStreamResult.toUIMessageStreamResponse({
        consumeSseStream: consumeStream,
      })
    }
    
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
    model: groqClient("openai/gpt-oss-120b"),
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
