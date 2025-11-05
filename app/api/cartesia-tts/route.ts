import { NextRequest, NextResponse } from "next/server";

function createWavHeader(dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  view.setUint8(0, 0x52); // 'R'
  view.setUint8(1, 0x49); // 'I'
  view.setUint8(2, 0x46); // 'F'
  view.setUint8(3, 0x46); // 'F'
  view.setUint32(4, 36 + dataLength, true); // File size
  view.setUint8(8, 0x57); // 'W'
  view.setUint8(9, 0x41); // 'A'
  view.setUint8(10, 0x56); // 'V'
  view.setUint8(11, 0x45); // 'E'

  // Format chunk
  view.setUint8(12, 0x66); // 'f'
  view.setUint8(13, 0x6d); // 'm'
  view.setUint8(14, 0x74); // 't'
  view.setUint8(15, 0x20); // ' '
  view.setUint32(16, 16, true); // Format chunk size
  view.setUint16(20, 1, true); // Audio format (PCM)
  view.setUint16(22, numChannels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // Byte rate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // Block align
  view.setUint16(34, bitsPerSample, true); // Bits per sample

  // Data chunk
  view.setUint8(36, 0x64); // 'd'
  view.setUint8(37, 0x61); // 'a'
  view.setUint8(38, 0x74); // 't'
  view.setUint8(39, 0x61); // 'a'
  view.setUint32(40, dataLength, true); // Data size

  return header;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Direct API call to Cartesia HTTP endpoint
    const url = 'https://api.cartesia.ai/tts/bytes';
    const options = {
      method: 'POST',
      headers: {
        'Cartesia-Version': '2024-06-10',
        'X-API-Key': process.env.CARTESIA_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model_id: "sonic-3",
        transcript: text,
        voice: {
          mode: "id",
          id: "a0e99841-438c-4a64-b679-ae501e7d6091"
        },
        language: "en",
        output_format: {
          container: "raw",
          encoding: "pcm_s16le",
          sample_rate: 44100
        }
      })
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Cartesia API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Create WAV header for the raw PCM data
    const wavHeader = createWavHeader(arrayBuffer.byteLength, 44100, 1, 16); // 44.1kHz, mono, 16-bit

    // Combine header and data
    const wavBuffer = new Uint8Array(wavHeader.byteLength + arrayBuffer.byteLength);
    wavBuffer.set(new Uint8Array(wavHeader), 0);
    wavBuffer.set(new Uint8Array(arrayBuffer), wavHeader.byteLength);

    return new NextResponse(wavBuffer, {
      headers: {
        "Content-Type": "audio/wav",
      },
    });
  } catch (error) {
    console.error("Cartesia TTS error:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}
