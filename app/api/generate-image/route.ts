import { fal } from "@fal-ai/client"

export const maxDuration = 60

// Configure FAL client
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY,
  })
}

export async function POST(req: Request) {
  if (!process.env.FAL_KEY) {
    return Response.json({ error: "Missing FAL_KEY environment variable" }, { status: 500 })
  }

  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Invalid prompt" }, { status: 400 })
    }

    console.log("Generating image for prompt:", prompt)

    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: {
        prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "jpeg",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach(console.log)
        }
      },
    })

    console.log("Image generated:", result.data)

    if (result.data?.images?.[0]) {
      const image = result.data.images[0]
      return Response.json({
        success: true,
        imageUrl: image.url,
        width: image.width,
        height: image.height,
      })
    }

    return Response.json({ error: "No image generated" }, { status: 500 })
  } catch (error) {
    console.error("Error generating image:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 },
    )
  }
}
