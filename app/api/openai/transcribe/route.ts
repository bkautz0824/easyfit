import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/openai/client";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    // Transcribe using OpenAI Whisper
    const transcript = await transcribeAudio(audioFile);

    return NextResponse.json({
      transcript,
      success: true,
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
