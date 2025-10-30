import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateInsights, WorkoutWithContext } from "@/lib/agents/insight-generator";
import type { Id } from "@/convex/_generated/dataModel";

// Initialize Convex client for server-side calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, dateRange } = body as {
      userId: Id<"users">;
      dateRange?: { startDate: string; endDate: string };
    };

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Step 1: Fetch resolved workouts for the user
    const workouts = await convex.query(api.workouts.getResolvedWorkouts, {
      userId,
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate,
    });

    if (workouts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No workouts found to analyze",
        insights: [],
      });
    }

    // Step 2: Fetch workout context for each workout
    const workoutsWithContext: WorkoutWithContext[] = await Promise.all(
      workouts.map(async (workout) => {
        // Get subjective context if it exists
        const context = await convex.query(api.workoutContext.getByWorkout, {
          workoutId: workout._id,
        });

        // Combine objective + subjective data
        return {
          workoutId: workout._id,
          date: workout.date,
          type: workout.type,
          duration: workout.duration,
          avgHeartRate: workout.avgHeartRate,
          maxHeartRate: workout.maxHeartRate,
          caloriesBurned: workout.caloriesBurned,
          distance: workout.distance,
          avgPace: workout.avgPace,
          elevationGain: workout.elevationGain,
          trainingLoad: workout.trainingLoad,

          // Add subjective context if available
          voiceTranscript: context?.voiceTranscript,
          workoutSubType: context?.workoutSubType,
          perceivedExertion: context?.perceivedExertion,
          mood: context?.mood,
          energyLevel: context?.energyLevel,
          themes: context?.themes,
          bodyParts: context?.bodyParts,
          feelings: context?.feelings,
          keywords: context?.keywords,
          painPoints: context?.painPoints,
          positiveAspects: context?.positiveAspects,
          challenges: context?.challenges,
          weatherImpact: context?.weatherImpact,
          equipmentNotes: context?.equipmentNotes,
          routeNotes: context?.routeNotes,
          nutritionNotes: context?.nutritionNotes,
          sleepQuality: context?.sleepQuality,
          aiSummary: context?.aiSummary,
        };
      })
    );

    // Step 3: Generate insights using Claude
    const generatedInsights = await generateInsights(
      workoutsWithContext,
      userId
    );

    // Step 4: Save insights to Convex
    const savedInsights = await Promise.all(
      generatedInsights.map(async (insight) => {
        return await convex.mutation(api.insights.createInsight, {
          userId: insight.userId,
          workoutIds: insight.workoutIds,
          insightText: insight.insightText,
          category: insight.category,
          confidence: insight.confidence,
          priority: insight.priority,
          metadata: insight.metadata,
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedInsights.length} insights from ${workouts.length} workouts`,
      insights: savedInsights,
      stats: {
        totalWorkouts: workouts.length,
        withContext: workoutsWithContext.filter((w) => w.voiceTranscript).length,
        insightsGenerated: generatedInsights.length,
      },
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      {
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
