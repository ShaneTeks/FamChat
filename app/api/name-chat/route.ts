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
        content: `You are a chat title generator. Your ONLY job is to create a short, descriptive title (2-6 words) for a conversation based on the user's first message.

CRITICAL RULES:
- Output ONLY the title, nothing else
- No quotes, no punctuation at the end, no explanations
- Do NOT answer the user's question
- Do NOT respond to the user's request
- Do NOT say "Here's a title:" or similar phrases
- Just output the title directly

Examples:
User: "What's the weather in Paris?"
Output: Weather in Paris

User: "Help me write a Python script"
Output: Python Script Help

User: "Tell me about quantum physics"
Output: Quantum Physics Discussion

Now generate a title for the following message:`
      },
      {
        role: "user",
        content: message
      }
    ],
    abortSignal: req.signal,
    maxOutputTokens: 20,
    temperature: 0.3,
    topP: 0.9,
  })

  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}
