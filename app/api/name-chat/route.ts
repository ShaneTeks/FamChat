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

  console.log("Received body for naming:", JSON.stringify(body))

  if (!body || typeof body !== "object") {
    return new Response("Invalid request body", { status: 400 })
  }

  const { message } = body as { message?: string }

  console.log("Extracted message for naming:", message)

  if (!message || typeof message !== "string") {
    return new Response("No message provided", { status: 400 })
  }

  // Use the llama-3.1-8b-instant model for chat naming
  const result = streamText({
    model: groqClient("llama-3.1-8b-instant"),
    messages: [
      {
        role: "system",
        content: "Your task is to generate a chat name in one short sentence, return only the chat sentence nothing else. Clear and concise. Do not include anything else other than chat name. Chat name should be like a summary of the prompt"
      },
      {
        role: "user",
        content: message
      }
    ],
    abortSignal: req.signal,
    maxOutputTokens: 50,
    temperature: 1,
    topP: 1,
  })

  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}
