import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    // Authentication is handled by middleware

    const { text, voiceId } = await req.json() as { text: string; voiceId?: string };

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Generate speech using Eleven Labs
    const audio = await elevenlabs.textToSpeech.convert(
      voiceId || "21m00Tcm4TlvDq8ikWAM", // Default voice (Rachel)
      {
        text,
        modelId: "eleven_multilingual_v2",
      }
    );

    // Convert ReadableStream to buffer
    const reader = audio.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error in TTS route:", error);
    return NextResponse.json(
      {
        error: "Failed to generate speech",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
