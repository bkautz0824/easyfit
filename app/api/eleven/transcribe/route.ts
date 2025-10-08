import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    // Authentication is handled by middleware

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // TODO: Implement actual Eleven Labs transcription
    // For now, return a placeholder response
    // Once Eleven Labs Speech-to-Text API is available, use:
    // const result = await elevenlabs.speechToText.convert(buffer);

    return NextResponse.json({
      text: "Placeholder transcription - Eleven Labs STT integration pending",
      duration: 0,
    });
  } catch (error) {
    console.error("Error in transcription route:", error);
    return NextResponse.json(
      {
        error: "Failed to transcribe audio",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
