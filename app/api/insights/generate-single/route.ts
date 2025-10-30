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
    const { userId, workoutId } = body as {
      userId: Id<"users">;
      workoutId: Id<"workouts">;
    };

    if (!userId || !workoutId) {
      return NextResponse.json(
        { error: "userId and workoutId are required" },
        { status: 400 }
      );
    }

    // Step 1: Fetch ALL resolved workouts for comprehensive analysis
    const allWorkouts = await convex.query(api.workouts.getResolvedWorkouts, {
      userId,
    });

    if (allWorkouts.length === 0) {
      return NextResponse.json(
        { error: "No resolved workouts found" },
        { status: 400 }
      );
    }

    // Step 2: Combine all workouts with their contexts
    const workoutsWithContext: WorkoutWithContext[] = await Promise.all(
      allWorkouts.map(async (workout) => {
        const context = await convex.query(api.workoutContext.getByWorkout, {
          workoutId: workout._id,
        });

        return {
          workoutId: workout._id,
          date: workout.date,
          type: context?.workoutType, // Type comes from context, not workout
          duration: workout.duration,
          avgHeartRate: workout.avgHeartRate,
          maxHeartRate: workout.maxHeartRate,
          caloriesBurned: workout.caloriesBurned,
          distance: workout.distance,
          avgPace: workout.avgPace,
          elevationGain: workout.elevationGain,
          trainingLoad: workout.trainingLoad,

          // Subjective context (if available)
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

    // Step 3: Generate insights analyzing ALL workout data
    // This creates a "snapshot" of insights at this point in time
    console.log(`Generating insights for ${workoutsWithContext.length} workouts...`);
    console.log("Workout data summary:", workoutsWithContext.map(w => ({
      id: w.workoutId,
      hasContext: !!w.voiceTranscript,
      date: w.date,
      type: w.type
    })));

    const generatedInsights = await generateInsights(
      workoutsWithContext,
      userId
    );

    console.log(`Generated ${generatedInsights.length} insights`);

    if (generatedInsights.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No insights generated from workout data",
        insights: [],
        debug: {
          totalWorkouts: workoutsWithContext.length,
          workoutsWithContext: workoutsWithContext.filter(w => w.voiceTranscript).length,
        }
      });
    }

    // Step 4: Associate all insights with the trigger workout as a "checkpoint"
    // This creates a snapshot of insights at this moment in your training journey
    const savedInsights = await Promise.all(
      generatedInsights.map(async (insight) => {
        return await convex.mutation(api.insights.createInsight, {
          userId: insight.userId,
          // Associate with the trigger workout (the one user clicked on)
          workoutIds: [workoutId],
          insightText: insight.insightText,
          category: insight.category,
          confidence: insight.confidence,
          priority: insight.priority,
          generatedAt: insight.generatedAt, // Pass through the generated timestamp
          metadata: {
            ...insight.metadata,
            // Store that this analyzed all workouts up to this point
            analysisSnapshot: {
              totalWorkoutsAnalyzed: workoutsWithContext.length,
              analysisDate: new Date().toISOString(),
              triggerWorkoutId: workoutId,
            },
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedInsights.length} insight(s) by analyzing ${workoutsWithContext.length} workout(s)`,
      insights: savedInsights,
      stats: {
        totalWorkoutsAnalyzed: workoutsWithContext.length,
        insightsGenerated: generatedInsights.length,
      },
    });
  } catch (error) {
    console.error("Error generating single workout insight:", error);
    return NextResponse.json(
      {
        error: "Failed to generate insight",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
