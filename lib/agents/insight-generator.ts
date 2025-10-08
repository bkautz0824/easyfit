import { callClaude } from "./claude";
import { Workout, Insight } from "../types";

export async function generateInsights(
  workouts: Workout[],
  userId: string
): Promise<Omit<Insight, "_id">[]> {
  if (workouts.length === 0) {
    return [];
  }

  const workoutSummary = workouts
    .map(
      (w) =>
        `${w.date}: ${w.type || "Workout"} - ${w.duration}min, ${w.avgHeartRate} avg HR, ${w.caloriesBurned} cal${w.notes ? ` - ${w.notes}` : ""}`
    )
    .join("\n");

  const systemPrompt = `You are a professional fitness coach analyzing workout data. Generate actionable insights based on patterns, performance, recovery needs, and potential warnings. Be specific, encouraging, and data-driven.`;

  const userPrompt = `Analyze these recent workouts and generate 3-5 insights:

${workoutSummary}

For each insight, provide:
1. The insight text (2-3 sentences)
2. Category: "recovery", "performance", "pattern", or "warning"
3. Confidence level (0-1)

Format as JSON array:
[
  {
    "insightText": "...",
    "category": "...",
    "confidence": 0.85
  }
]`;

  try {
    const response = await callClaude({
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
      max_tokens: 1500,
      temperature: 0.7,
    });

    // Parse JSON response
    const insights = JSON.parse(response.content);
    const now = new Date().toISOString();

    return insights.map((insight: any) => ({
      userId,
      workoutIds: workouts.map((w) => w._id),
      insightText: insight.insightText,
      category: insight.category,
      generatedAt: now,
      confidence: insight.confidence,
    }));
  } catch (error) {
    console.error("Error generating insights:", error);
    throw new Error(
      `Failed to generate insights: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
