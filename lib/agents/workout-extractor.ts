import { callClaude } from "./claude";

export interface ExtractedWorkoutContext {
  // Core classification
  workoutType?: string; // "run", "bike", "swim", "strength", "yoga", etc.
  workoutSubType?: string; // "tempo", "intervals", "recovery", "long", "fartlek", "hills"

  // Perceived metrics
  perceivedExertion?: number; // 1-10 RPE scale
  mood?: string; // "great", "tired", "stressed", "motivated", "frustrated"
  energyLevel?: string; // "high", "medium", "low"

  // Semantic tags for searchability
  themes?: string[]; // ["struggled with pace", "recovery focused", "felt strong"]
  bodyParts?: string[]; // ["knee", "hamstring", "lower back", "shoulders"]
  feelings?: string[]; // ["exhausted", "energized", "sore", "powerful"]
  keywords?: string[]; // ["hill repeats", "new PR", "race prep", "easy spin"]

  // Specific observations
  painPoints?: string[]; // ["left knee pain on downhills", "tight right calf"]
  positiveAspects?: string[]; // ["strong finish", "maintained pace", "good form"]
  challenges?: string[]; // ["struggled in heat", "difficulty breathing"]

  // Contextual factors
  weatherImpact?: string;
  equipmentNotes?: string;
  routeNotes?: string;
  nutritionNotes?: string;
  sleepQuality?: string;

  // AI-generated
  aiSummary: string; // 2-3 sentence intelligent summary
  trainingRecommendation?: string; // Suggestion for next workout
}

const WORKOUT_EXTRACTION_PROMPT = `You are an expert fitness coach analyzing workout context from voice transcripts.

Your job is to extract structured, semantic data that will be used for:
1. Pattern detection across workout history
2. Injury prevention and pain tracking
3. Performance trend analysis
4. Semantic search (finding similar experiences)
5. AI-powered insights generation

EXTRACTION GUIDELINES:

**Workout Classification:**
- workoutType: Primary activity (run, bike, swim, strength, yoga, crossfit, etc.)
- workoutSubType: Training style (tempo, intervals, recovery, long, fartlek, hills, easy, threshold)

**Perceived Metrics:**
- perceivedExertion: Rate 1-10 (1=very easy, 10=maximum effort)
- mood: Overall emotional state (great, good, tired, stressed, motivated, frustrated, anxious)
- energyLevel: Physical energy (high, medium, low)

**Semantic Tags (CRITICAL for search):**
- themes: High-level workout characterizations ["felt strong throughout", "struggled second half", "recovery focused"]
- bodyParts: ANY mentioned body parts ["left knee", "right hamstring", "lower back", "shoulders", "quads"]
- feelings: Physical/mental states ["exhausted", "energized", "sore", "powerful", "sluggish", "sharp"]
- keywords: Training terminology ["PR", "negative split", "bonk", "zone 2", "threshold", "fartlek"]

**Observations:**
- painPoints: Specific pain/discomfort with location ["left knee pain on downhills", "tight right calf after mile 3"]
- positiveAspects: What went well ["maintained target pace", "strong finish", "good form", "controlled breathing"]
- challenges: Difficulties faced ["struggled in heat", "pacing too fast early", "mental fatigue mile 8"]

**External Factors:**
- weatherImpact: How conditions affected performance
- equipmentNotes: Gear issues or successes
- routeNotes: Course characteristics
- nutritionNotes: Fueling strategy
- sleepQuality: How sleep affected workout

**AI Summary:**
- Write 2-3 sentences synthesizing the workout experience
- Focus on WHY things happened, not just WHAT happened
- Connect objective metrics (if mentioned) with subjective experience
- Note any concerning patterns or impressive achievements

**Training Recommendation:**
- Based on the workout, suggest next steps
- Consider recovery needs, injury risk, training phase
- Be specific and actionable

IMPORTANT:
- Be precise with body parts (use "left knee" not just "knee")
- Capture the user's exact language in themes/keywords
- If pain is mentioned, extract it to painPoints
- If nothing mentioned for a field, omit it (don't guess)
- RPE should match described effort level
- Look for subtle indicators (e.g., "had to really push" = high RPE)

Return ONLY valid JSON matching the TypeScript interface. No markdown, no explanations.`;

export async function extractWorkoutContext(
  transcript: string
): Promise<ExtractedWorkoutContext> {
  try {
    const response = await callClaude({
      messages: [
        {
          role: "user",
          content: `Extract workout context from this transcript:

"${transcript}"

Return JSON only.`,
        },
      ],
      system: WORKOUT_EXTRACTION_PROMPT,
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    // Parse Claude's JSON response
    const extracted = JSON.parse(response.content);

    // Validate required field
    if (!extracted.aiSummary) {
      extracted.aiSummary =
        "Workout completed. No additional context extracted.";
    }

    return extracted as ExtractedWorkoutContext;
  } catch (error) {
    console.error("Error extracting workout context:", error);

    // Fallback if extraction fails
    return {
      aiSummary: transcript.substring(0, 200), // First 200 chars as summary
      trainingRecommendation:
        "Unable to generate recommendation. Please review workout manually.",
    };
  }
}
