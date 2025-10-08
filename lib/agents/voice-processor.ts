import { callClaude } from "./claude";
import { CreateWorkoutInput } from "../types";

export async function processWorkoutVoiceInput(
  transcription: string,
  userId: string
): Promise<CreateWorkoutInput> {
  const systemPrompt = `You are a fitness assistant that extracts structured workout data from natural language descriptions.

Extract:
- Date (default to today if not specified)
- Type (running, cycling, strength, yoga, etc.)
- Duration in minutes
- Average heart rate (if mentioned, otherwise estimate based on workout type and intensity)
- Max heart rate (if mentioned)
- Calories burned (estimate if not provided)
- Notes (any additional context)

Always respond with valid JSON.`;

  const userPrompt = `Extract workout data from this description:

"${transcription}"

Current date/time: ${new Date().toISOString()}

Respond with JSON:
{
  "date": "ISO date string",
  "type": "workout type",
  "duration": number in minutes,
  "avgHeartRate": number,
  "maxHeartRate": number or null,
  "caloriesBurned": number,
  "notes": "original description or key points"
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
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    // Parse JSON response
    const workout = JSON.parse(response.content);

    return {
      userId,
      date: workout.date,
      type: workout.type,
      duration: workout.duration,
      avgHeartRate: workout.avgHeartRate,
      maxHeartRate: workout.maxHeartRate,
      caloriesBurned: workout.caloriesBurned,
      notes: workout.notes,
    };
  } catch (error) {
    console.error("Error processing voice input:", error);
    throw new Error(
      `Failed to process workout description: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
