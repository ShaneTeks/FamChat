import { streamText, consumeStream } from "ai"
import { createGroq } from "@ai-sdk/groq"

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

  const { messages } = body as { messages?: Array<{ role: string; content: string }> }

  console.log("Extracted messages:", messages)

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response("No messages provided", { status: 400 })
  }

  // Add system message to instruct the AI about image generation capability
  const systemMessage = `You are a helpful AI assistant with the ability to generate images. When a user asks you to create, generate, or draw an image, respond with a JSON object in the following format:
{
  "type": "image",
  "prompt": "detailed description of the image",
  "message": "your response to the user"
}

For normal conversations without image requests, just respond naturally with text.`

  // streamText accepts messages directly in the format { role, content }
  const result = streamText({
    model: groqClient("llama-3.3-70b-versatile"),
    system: systemMessage,
    messages: messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    abortSignal: req.signal,
    maxOutputTokens: 2000,
    temperature: 0.7,
  })

  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}
