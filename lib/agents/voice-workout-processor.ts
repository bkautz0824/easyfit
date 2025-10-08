import { callClaude } from "./claude";

export interface WearableMetrics {
  avgHeartRate: number;
  maxHeartRate?: number;
  duration: number;
  distance?: number;
  avgPace?: string;
  avgPower?: number;
  cadence?: number;
  elevationGain?: number;
  caloriesBurned: number;
}

export interface ExtractedWorkoutContext {
  // Raw transcript (always preserved)
  voiceTranscript: string;

  // Core classification
  workoutType?: string;
  workoutSubType?: string;

  // Perceived metrics
  perceivedExertion?: number;
  mood?: string;
  energyLevel?: string;

  // Semantic tags (for searchability)
  themes?: string[];
  bodyParts?: string[];
  feelings?: string[];
  keywords?: string[];

  // Specific observations
  painPoints?: string[];
  positiveAspects?: string[];
  challenges?: string[];

  // Contextual factors
  weatherImpact?: string;
  equipmentNotes?: string;
  routeNotes?: string;
  nutritionNotes?: string;
  sleepQuality?: string;

  // AI insights
  aiSummary: string;
  trainingRecommendation?: string;
}

/**
 * Intelligently process voice transcript using Claude to extract rich, searchable context
 * NO embeddings needed - Claude extracts semantic tags for traditional queries
 */
export async function processWorkoutVoice(
  transcript: string,
  wearableMetrics: WearableMetrics
): Promise<ExtractedWorkoutContext> {
  const systemPrompt = `You are an elite fitness coach and data analyst. Extract comprehensive, searchable information from a workout voice note.

Your job is to create RICH SEMANTIC TAGS that enable powerful searching later.

Wearable Data Context:
- Avg HR: ${wearableMetrics.avgHeartRate} bpm, Max: ${wearableMetrics.maxHeartRate || "N/A"} bpm
- Duration: ${wearableMetrics.duration} min
${wearableMetrics.distance ? `- Distance: ${wearableMetrics.distance} km` : ""}
${wearableMetrics.avgPace ? `- Pace: ${wearableMetrics.avgPace}` : ""}
${wearableMetrics.avgPower ? `- Power: ${wearableMetrics.avgPower}W` : ""}
- Calories: ${wearableMetrics.caloriesBurned}

Extract these fields intelligently:

1. **workoutType**: run, bike, swim, strength, yoga, hike, other
2. **workoutSubType**: tempo, intervals, recovery, long, easy, fartlek, race-pace, threshold, etc.
3. **perceivedExertion**: RPE 1-10 (infer from language even if not explicitly stated)
4. **mood**: great, good, tired, stressed, motivated, frustrated, etc.
5. **energyLevel**: high, medium, low

6. **themes**: Array of semantic themes for searching
   Examples: ["struggled with pacing", "felt unusually strong", "recovery focused", "race simulation"]

7. **bodyParts**: ANY body parts mentioned (for injury/pain tracking)
   Examples: ["knee", "hamstring", "lower back", "shoulders", "calves", "IT band"]

8. **feelings**: Emotional/physical feelings
   Examples: ["exhausted", "energized", "sore", "powerful", "sluggish", "explosive"]

9. **keywords**: Important training terms/phrases
   Examples: ["hill repeats", "threshold work", "negative splits", "race prep", "easy spin"]

10. **painPoints**: Specific pain or discomfort (be detailed)
    Examples: ["left knee pain on downhills", "right achilles tightness at mile 3"]

11. **positiveAspects**: What went well
    Examples: ["strong finish", "maintained target pace", "felt controlled", "good breathing"]

12. **challenges**: What was difficult
    Examples: ["struggled in heat", "couldn't hold pace", "mental fatigue", "stomach issues"]

13. **weatherImpact**: How weather affected workout (if mentioned)
14. **equipmentNotes**: Any gear issues or notes
15. **routeNotes**: Route-specific details
16. **nutritionNotes**: Fueling/hydration mentions
17. **sleepQuality**: If sleep quality mentioned and its impact

18. **aiSummary**: 2-3 sentence intelligent summary combining objective + subjective data
19. **trainingRecommendation**: Brief suggestion for next workout based on this one

BE INTELLIGENT:
- Infer RPE from language ("pushed hard" = 8-9, "easy" = 3-4)
- Extract implicit themes ("felt slow today" → themes: ["below average performance"])
- Catch ALL body part mentions for injury tracking
- Create searchable keywords from training terminology

Respond with VALID JSON only:
{
  "workoutType": "string",
  "workoutSubType": "string or null",
  "perceivedExertion": number or null,
  "mood": "string or null",
  "energyLevel": "string or null",
  "themes": ["array"] or null,
  "bodyParts": ["array"] or null,
  "feelings": ["array"] or null,
  "keywords": ["array"] or null,
  "painPoints": ["array"] or null,
  "positiveAspects": ["array"] or null,
  "challenges": ["array"] or null,
  "weatherImpact": "string or null",
  "equipmentNotes": "string or null",
  "routeNotes": "string or null",
  "nutritionNotes": "string or null",
  "sleepQuality": "string or null",
  "aiSummary": "2-3 sentences combining wearable + voice data",
  "trainingRecommendation": "brief suggestion or null"
}`;

  try {
    const response = await callClaude({
      messages: [
        {
          role: "user",
          content: `Voice note: "${transcript}"\n\nExtract comprehensive workout context as JSON.`,
        },
      ],
      system: systemPrompt,
      temperature: 0.3, // Lower for consistent extraction
      max_tokens: 2000,
    });

    // Parse Claude's response
    const extracted = JSON.parse(response.content);

    return {
      voiceTranscript: transcript, // Always preserve raw transcript
      workoutType: extracted.workoutType || undefined,
      workoutSubType: extracted.workoutSubType || undefined,
      perceivedExertion: extracted.perceivedExertion || undefined,
      mood: extracted.mood || undefined,
      energyLevel: extracted.energyLevel || undefined,
      themes: extracted.themes || undefined,
      bodyParts: extracted.bodyParts || undefined,
      feelings: extracted.feelings || undefined,
      keywords: extracted.keywords || undefined,
      painPoints: extracted.painPoints || undefined,
      positiveAspects: extracted.positiveAspects || undefined,
      challenges: extracted.challenges || undefined,
      weatherImpact: extracted.weatherImpact || undefined,
      equipmentNotes: extracted.equipmentNotes || undefined,
      routeNotes: extracted.routeNotes || undefined,
      nutritionNotes: extracted.nutritionNotes || undefined,
      sleepQuality: extracted.sleepQuality || undefined,
      aiSummary: extracted.aiSummary,
      trainingRecommendation: extracted.trainingRecommendation || undefined,
    };
  } catch (error) {
    console.error("Error processing workout voice with Claude:", error);
    throw new Error(
      `Failed to extract workout context: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
