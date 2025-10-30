import { callClaude } from "./claude";

/**
 * Combined workout data: objective metrics + subjective context
 */
export interface WorkoutWithContext {
  // Objective data (from wearables)
  workoutId: string;
  date: string;
  type?: string;
  duration: number;
  avgHeartRate: number;
  maxHeartRate?: number;
  caloriesBurned: number;
  distance?: number;
  avgPace?: string;
  elevationGain?: number;
  trainingLoad?: number;

  // Subjective context (from voice/text)
  voiceTranscript?: string;
  workoutSubType?: string;
  perceivedExertion?: number;
  mood?: string;
  energyLevel?: string;
  themes?: string[];
  bodyParts?: string[];
  feelings?: string[];
  keywords?: string[];
  painPoints?: string[];
  positiveAspects?: string[];
  challenges?: string[];
  weatherImpact?: string;
  equipmentNotes?: string;
  routeNotes?: string;
  nutritionNotes?: string;
  sleepQuality?: string;
  aiSummary?: string;
}

export interface GeneratedInsight {
  userId: string;
  workoutIds: string[];
  insightText: string;
  category: "performance" | "recovery" | "injury_risk" | "pattern" | "recommendation";
  generatedAt: string;
  confidence: number;
  priority: "low" | "medium" | "high";
  metadata?: {
    relatedThemes?: string[];
    relatedBodyParts?: string[];
    trendData?: Record<string, any>;
  };
}

/**
 * Generate AI-powered insights by combining objective and subjective workout data
 *
 * Note: This analyzes ALL provided workouts to identify patterns, trends, and risks.
 * Even with just 1 workout, it will provide initial observations.
 * As more workouts are added, insights become more sophisticated and pattern-based.
 */
export async function generateInsights(
  workouts: WorkoutWithContext[],
  userId: string
): Promise<GeneratedInsight[]> {
  if (workouts.length === 0) {
    return [];
  }

  // Build comprehensive workout analysis
  const workoutAnalysis = analyzeWorkoutData(workouts);

  const systemPrompt = `You are an elite fitness coach with expertise in biomechanics, sports psychology, and data-driven training.

Your role is to analyze workout data that combines:
1. **Objective metrics** from wearable devices (heart rate, pace, distance, calories)
2. **Subjective context** from athlete voice notes (feelings, pain points, challenges, mood)

Generate insights that:
- Connect objective performance with subjective experience
- Identify patterns that the athlete might not see
- Provide actionable, specific recommendations
- Flag potential injury risks early
- Celebrate progress and positive trends
- Are honest but encouraging

Focus on semantic patterns in the subjective data (themes, feelings, pain points) combined with quantitative trends.`;

  const userPrompt = `Analyze this athlete's training data and generate insights.

## Training Data Summary
- **Total workouts analyzed**: ${workouts.length}
- **Total distance**: ${workoutAnalysis.totalDistance.toFixed(1)} miles
- **Average heart rate**: ${workoutAnalysis.avgHeartRate.toFixed(0)} bpm (${workoutAnalysis.heartRateTrend})
- **Average training load**: ${workoutAnalysis.avgTrainingLoad.toFixed(0)} (${workoutAnalysis.trainingLoadTrend})
- **Average RPE**: ${workoutAnalysis.avgRPE > 0 ? workoutAnalysis.avgRPE.toFixed(1) : 'N/A'}/10

## Subjective Patterns
- **Common themes**: ${workoutAnalysis.commonThemes.join(", ") || "None yet"}
- **Recurring feelings**: ${workoutAnalysis.commonFeelings.join(", ") || "None yet"}
- **Body parts mentioned**: ${workoutAnalysis.bodyParts.join(", ") || "None"}
- **Pain points**: ${workoutAnalysis.painPoints.length} workout(s) with pain
- **Positive aspects**: ${workoutAnalysis.positiveAspects.length} positive note(s)

## Detailed Workout Log
${workoutAnalysis.detailedLog}

## Your Task
Generate insights based on the available data. ${workouts.length === 1 ? 'Note: This is the first workout logged, so focus on initial observations and baseline establishment rather than patterns.' : `With ${workouts.length} workouts, identify emerging patterns and trends.`}

For each insight:
1. **Connect data** - How does subjective experience relate to objective metrics?
2. **Identify concerns** - Any warning signs (pain, overtraining, poor recovery)?
3. **Provide guidance** - Actionable recommendations based on the data

**Response Format (JSON array):**
[
  {
    "insightText": "Specific, actionable insight (2-4 sentences)",
    "category": "performance|recovery|injury_risk|pattern|recommendation",
    "confidence": 0.0-1.0,
    "priority": "low|medium|high",
    "metadata": {
      "relatedThemes": ["theme1", "theme2"],
      "relatedBodyParts": ["knee", "hamstring"],
      "trendData": { "metric": "value" }
    }
  }
]

**Requirements:**
- Generate ${workouts.length === 1 ? '2-3 insights (initial observations)' : workouts.length < 5 ? '3-5 insights (emerging patterns)' : '3-8 insights (comprehensive analysis)'}
- Prioritize injury risk and recovery insights if present
- Be specific (reference actual data points)
- Adjust confidence based on data availability (fewer workouts = lower confidence)
- Use metadata to tag related themes/body parts`;

  try {
    console.log("Calling Claude for insight generation...");
    const response = await callClaude({
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: systemPrompt,
      max_tokens: 3000,
      temperature: 0.5, // Lower temp for more consistent analysis
    });

    console.log("Claude response received:", response.content.substring(0, 200));

    // Parse JSON response - strip markdown code blocks if present
    let jsonContent = response.content.trim();

    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent
        .replace(/^```(?:json)?\n?/i, "") // Remove opening ```json or ```
        .replace(/\n?```$/, ""); // Remove closing ```
    }

    const insights = JSON.parse(jsonContent) as GeneratedInsight[];
    const now = new Date().toISOString();

    console.log(`Parsed ${insights.length} insights from Claude response`);

    return insights.map((insight) => ({
      ...insight,
      userId,
      workoutIds: workouts.map((w) => w.workoutId),
      generatedAt: now,
    }));
  } catch (error) {
    console.error("Error generating insights:", error);
    console.log("Using fallback insights due to error");

    // Return fallback insights if Claude fails
    return generateFallbackInsights(workouts, userId);
  }
}

/**
 * Analyze workout data to extract trends and patterns
 */
function analyzeWorkoutData(workouts: WorkoutWithContext[]) {
  const totalWorkouts = workouts.length;

  // Objective metrics
  const avgHeartRate = workouts.reduce((sum, w) => sum + w.avgHeartRate, 0) / totalWorkouts;
  const avgTrainingLoad = workouts.reduce((sum, w) => sum + (w.trainingLoad || 0), 0) / totalWorkouts;
  const totalDistance = workouts.reduce((sum, w) => sum + (w.distance || 0), 0);

  // Trends (compare first half vs second half)
  const midpoint = Math.floor(totalWorkouts / 2);
  const firstHalfHR = workouts.slice(0, midpoint).reduce((sum, w) => sum + w.avgHeartRate, 0) / midpoint;
  const secondHalfHR = workouts.slice(midpoint).reduce((sum, w) => sum + w.avgHeartRate, 0) / (totalWorkouts - midpoint);
  const heartRateTrend = secondHalfHR > firstHalfHR ? "↑ increasing" : secondHalfHR < firstHalfHR ? "↓ decreasing" : "→ stable";

  const firstHalfLoad = workouts.slice(0, midpoint).reduce((sum, w) => sum + (w.trainingLoad || 0), 0) / midpoint;
  const secondHalfLoad = workouts.slice(midpoint).reduce((sum, w) => sum + (w.trainingLoad || 0), 0) / (totalWorkouts - midpoint);
  const trainingLoadTrend = secondHalfLoad > firstHalfLoad ? "↑ increasing" : secondHalfLoad < firstHalfLoad ? "↓ decreasing" : "→ stable";

  // Subjective patterns
  const allThemes = workouts.flatMap((w) => w.themes || []);
  const allFeelings = workouts.flatMap((w) => w.feelings || []);
  const allBodyParts = workouts.flatMap((w) => w.bodyParts || []);
  const painPoints = workouts.filter((w) => w.painPoints && w.painPoints.length > 0);
  const positiveAspects = workouts.filter((w) => w.positiveAspects && w.positiveAspects.length > 0);

  const avgRPE = workouts.reduce((sum, w) => sum + (w.perceivedExertion || 0), 0) / workouts.filter(w => w.perceivedExertion).length || 0;

  // Find most common themes/feelings
  const themeCounts = countOccurrences(allThemes);
  const feelingCounts = countOccurrences(allFeelings);
  const bodyPartCounts = countOccurrences(allBodyParts);

  const commonThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((e) => e[0]);

  const commonFeelings = Object.entries(feelingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((e) => e[0]);

  const bodyParts = Object.keys(bodyPartCounts);

  // Create summary
  const summary = workouts
    .slice(0, 5)
    .map((w) => `${w.date}: ${w.type || "Workout"} - ${w.duration}min, ${w.avgHeartRate} bpm`)
    .join("\n");

  // Detailed log with subjective notes
  const detailedLog = workouts
    .map((w, idx) => {
      let log = `\n### Workout ${idx + 1}: ${w.date}
- Type: ${w.type || "Unknown"}
- Duration: ${w.duration} min | HR: ${w.avgHeartRate} bpm | Calories: ${w.caloriesBurned}`;

      if (w.distance) log += `\n- Distance: ${w.distance.toFixed(2)} mi | Pace: ${w.avgPace || "N/A"}`;
      if (w.trainingLoad) log += `\n- Training Load: ${w.trainingLoad}`;
      if (w.perceivedExertion) log += `\n- RPE: ${w.perceivedExertion}/10`;
      if (w.mood) log += `\n- Mood: ${w.mood}`;
      if (w.energyLevel) log += `\n- Energy: ${w.energyLevel}`;
      if (w.themes && w.themes.length > 0) log += `\n- Themes: ${w.themes.join(", ")}`;
      if (w.feelings && w.feelings.length > 0) log += `\n- Feelings: ${w.feelings.join(", ")}`;
      if (w.painPoints && w.painPoints.length > 0) log += `\n- Pain: ${w.painPoints.join(", ")}`;
      if (w.positiveAspects && w.positiveAspects.length > 0) log += `\n- Positives: ${w.positiveAspects.join(", ")}`;
      if (w.challenges && w.challenges.length > 0) log += `\n- Challenges: ${w.challenges.join(", ")}`;
      if (w.aiSummary) log += `\n- AI Summary: ${w.aiSummary}`;
      if (w.voiceTranscript) log += `\n- Notes: "${w.voiceTranscript.substring(0, 200)}${w.voiceTranscript.length > 200 ? "..." : ""}"`;

      return log;
    })
    .join("\n");

  return {
    summary,
    avgHeartRate,
    avgTrainingLoad,
    totalDistance,
    heartRateTrend,
    trainingLoadTrend,
    commonThemes,
    commonFeelings,
    bodyParts,
    painPoints,
    positiveAspects,
    avgRPE,
    detailedLog,
  };
}

/**
 * Helper to count occurrences of items in array
 */
function countOccurrences(arr: string[]): Record<string, number> {
  return arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Generate simple fallback insights if Claude fails
 */
function generateFallbackInsights(
  workouts: WorkoutWithContext[],
  userId: string
): GeneratedInsight[] {
  const now = new Date().toISOString();
  const workoutIds = workouts.map((w) => w.workoutId);

  const insights: GeneratedInsight[] = [];

  // Check for pain patterns
  const painWorkouts = workouts.filter((w) => w.painPoints && w.painPoints.length > 0);
  if (painWorkouts.length >= 2) {
    insights.push({
      userId,
      workoutIds,
      insightText: `You've reported pain in ${painWorkouts.length} of your last ${workouts.length} workouts. Consider scheduling a recovery day or consulting a professional.`,
      category: "injury_risk",
      confidence: 0.9,
      priority: "high",
      generatedAt: now,
      metadata: {
        relatedBodyParts: [...new Set(painWorkouts.flatMap((w) => w.bodyParts || []))],
      },
    });
  }

  // Check training load trend
  const avgLoad = workouts.reduce((sum, w) => sum + (w.trainingLoad || 0), 0) / workouts.length;
  if (avgLoad > 0) {
    insights.push({
      userId,
      workoutIds,
      insightText: `Your average training load is ${avgLoad.toFixed(0)}. This indicates ${avgLoad > 200 ? "high" : avgLoad > 100 ? "moderate" : "light"} training intensity.`,
      category: "performance",
      confidence: 0.7,
      priority: "medium",
      generatedAt: now,
    });
  }

  return insights;
}
