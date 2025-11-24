import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// Initialize Convex client for server-side calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workoutId, userId, transcript, extractedData, embedding } = body as {
      workoutId: Id<"workouts">;
      userId: string;
      transcript: string;
      extractedData: any;
      embedding: number[];
    };

    if (!workoutId || !userId || !transcript || !extractedData || !embedding) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get workout to verify it exists
    const workout = await convex.query(api.workouts.getById, { id: workoutId });

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }

    // Save to Convex with vector embedding
    // This stores:
    // 1. Structured data (all extracted fields)
    // 2. Vector embedding (for semantic search)
    // 3. Foreign key to objective workout data (workoutId)
    await convex.mutation(api.workoutContext.createContext, {
      workoutId,
      userId,
      voiceTranscript: transcript,
      embedding, // Vector stored alongside structured data in Convex
      workoutType: extractedData.workoutType,
      workoutSubType: extractedData.workoutSubType,
      perceivedExertion: extractedData.perceivedExertion,
      mood: extractedData.mood,
      energyLevel: extractedData.energyLevel,
      themes: extractedData.themes,
      bodyParts: extractedData.bodyParts,
      feelings: extractedData.feelings,
      keywords: extractedData.keywords,
      painPoints: extractedData.painPoints,
      positiveAspects: extractedData.positiveAspects,
      challenges: extractedData.challenges,
      weatherImpact: extractedData.weatherImpact,
      equipmentNotes: extractedData.equipmentNotes,
      routeNotes: extractedData.routeNotes,
      nutritionNotes: extractedData.nutritionNotes,
      sleepQuality: extractedData.sleepQuality,
      aiSummary: extractedData.aiSummary,
      trainingRecommendation: extractedData.trainingRecommendation,
    });

    // Update workout status to resolved
    await convex.mutation(api.workouts.updateStatus, {
      workoutId,
      status: "resolved",
    });

    return NextResponse.json({
      success: true,
      message: "Workout context saved successfully to Convex with vector embedding",
    });
  } catch (error) {
    console.error("Error saving context:", error);
    return NextResponse.json(
      {
        error: "Failed to save workout context",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
