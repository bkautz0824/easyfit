import { callClaude } from "./claude";
import { TrainingPlan, Workout } from "../types";

export interface TrainingPlanInput {
  userId: string;
  focus: string; // e.g., "strength", "endurance", "weight loss"
  duration: number; // weeks
  workouts: Workout[]; // Recent workout history
  fitnessLevel?: string; // "beginner", "intermediate", "advanced"
}

export async function generateTrainingPlan(
  input: TrainingPlanInput
): Promise<Omit<TrainingPlan, "_id">> {
  const { userId, focus, duration, workouts, fitnessLevel = "intermediate" } =
    input;

  const workoutHistory =
    workouts.length > 0
      ? workouts
          .map(
            (w) =>
              `${w.date}: ${w.type || "Workout"} - ${w.duration}min, ${w.avgHeartRate} avg HR`
          )
          .join("\n")
      : "No recent workout history";

  const systemPrompt = `You are an expert fitness trainer creating personalized training plans. Design progressive, balanced programs that prevent injury and optimize results.`;

  const userPrompt = `Create a ${duration}-week training plan focused on ${focus} for a ${fitnessLevel} athlete.

Recent workout history:
${workoutHistory}

Generate a plan with ${duration * 7} days (including rest days). For each day, provide:
- Day: "Week 1, Day 1" format
- Workout type: (e.g., "Strength", "Cardio", "Rest", "Active Recovery")
- Title: Short, motivating title
- Description: Brief overview
- Duration: in minutes
- Intensity: 1-10 scale
- Exercises: Array of exercises with sets, reps, duration, notes

Format as JSON:
{
  "focus": "${focus}",
  "days": [
    {
      "day": "Week 1, Day 1",
      "workoutType": "Strength",
      "title": "Upper Body Power",
      "description": "...",
      "duration": 45,
      "intensity": 7,
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": "8-10",
          "notes": "Focus on form"
        }
      ]
    }
  ],
  "notes": "General plan notes and tips"
}`;

  try {
    const response = await callClaude({
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
      max_tokens: 4000,
      temperature: 0.8,
    });

    // Parse JSON response
    const plan = JSON.parse(response.content);
    const now = new Date().toISOString();
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration * 7);

    return {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      focus: plan.focus,
      days: plan.days,
      notes: plan.notes,
      generatedAt: now,
    };
  } catch (error) {
    console.error("Error generating training plan:", error);
    throw new Error(
      `Failed to generate training plan: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
