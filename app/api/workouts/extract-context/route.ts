import { NextRequest, NextResponse } from "next/server";
import { extractWorkoutContext } from "@/lib/agents/workout-extractor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript } = body as { transcript: string };

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    // Extract structured data using Claude
    const extractedData = await extractWorkoutContext(transcript);

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error("Error extracting context:", error);
    return NextResponse.json(
      {
        error: "Failed to extract workout context",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
