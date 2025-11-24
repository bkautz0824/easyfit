import { ExtractedWorkoutContext } from "./voice-workout-processor";

export interface ValidationScore {
  total: number; // 0-100
  status: "blocked" | "minimal" | "good" | "excellent";
  missingCritical: string[]; // What's blocking submission
  can_continue: boolean;
  feedbackMessage: string; // Simple user-facing message
}

/**
 * Simplified scoring: Focus on essentials only
 *
 * Critical fields (must have at least 2 of 3):
 * - Intensity/RPE (30 pts)
 * - Body parts worked (30 pts)
 * - Energy/mood (20 pts)
 *
 * Valuable additions (20 pts total):
 * - Pain check (10 pts)
 * - What went well/poorly (10 pts)
 */
export function calculateContextScore(
  extracted: ExtractedWorkoutContext
): ValidationScore {
  let score = 0;
  const missing: string[] = [];

  // Critical fields
  const hasIntensity = !!extracted.perceivedExertion;
  const hasBodyParts = extracted.bodyParts && extracted.bodyParts.length > 0;
  const hasMoodEnergy = !!(extracted.mood || extracted.energyLevel);

  if (hasIntensity) score += 30;
  else missing.push("intensity (how hard: 1-10 or easy/moderate/hard)");

  if (hasBodyParts) score += 30;
  else missing.push("body parts worked");

  if (hasMoodEnergy) score += 20;
  else missing.push("energy level or mood");

  // Valuable additions
  if (extracted.painPoints && extracted.painPoints.length > 0) score += 10;
  if (extracted.challenges || extracted.positiveAspects) score += 10;

  // Determine status
  let status: ValidationScore["status"];
  const criticalCount = [hasIntensity, hasBodyParts, hasMoodEnergy].filter(Boolean).length;

  if (criticalCount < 2) {
    status = "blocked";
  } else if (score >= 80) {
    status = "excellent";
  } else if (score >= 60) {
    status = "good";
  } else {
    status = "minimal";
  }

  // Generate feedback
  let feedbackMessage = "";
  if (status === "blocked") {
    feedbackMessage = `Missing critical info: ${missing.join(", ")}. Add at least 2 of these to continue.`;
  } else if (status === "minimal") {
    feedbackMessage = "Good! Add pain check or what went well/poorly for richer insights.";
  } else if (status === "good") {
    feedbackMessage = "Great context! This will generate quality insights.";
  } else {
    feedbackMessage = "Excellent! Perfect level of detail.";
  }

  return {
    total: score,
    status,
    missingCritical: missing,
    can_continue: status !== "blocked",
    feedbackMessage,
  };
}


/**
 * Quick validation from raw transcript (BEFORE sending to OpenAI)
 * This saves API costs by catching low-quality submissions early
 *
 * Returns: { canProceed: boolean, missing: string[], estimatedScore: number }
 */
export function validateTranscriptBeforeProcessing(transcript: string): {
  canProceed: boolean;
  missing: string[];
  estimatedScore: number;
  message: string;
} {
  const missing: string[] = [];
  let score = 0;

  // Check for intensity/RPE (30 pts)
  const hasIntensity = /\b([1-9]|10)\s*(\/|out of)\s*10\b/i.test(transcript) ||
    /\b(easy|moderate|hard|intense|tough|light|heavy)\b/i.test(transcript);
  if (hasIntensity) score += 30;
  else missing.push("intensity");

  // Check for body parts (30 pts)
  const hasBodyParts = /\b(legs?|arms?|chest|back|shoulders?|core|abs|glutes?|quads?|hamstrings?|calves?|upper body|lower body|full body)\b/i.test(transcript);
  if (hasBodyParts) score += 30;
  else missing.push("body parts");

  // Check for energy/mood (20 pts)
  const hasMoodEnergy = /\b(energy|mood|felt|feeling|tired|motivated|exhausted|good|great|bad|sluggish|energized)\b/i.test(transcript);
  if (hasMoodEnergy) score += 20;
  else missing.push("energy/mood");

  // Bonus: pain check (10 pts)
  if (/\b(pain|sore|hurt|ache|tight|no pain|no issues|feeling good)\b/i.test(transcript)) {
    score += 10;
  }

  // Bonus: challenges/positives (10 pts)
  if (/\b(struggled|challenged|difficult|strong|great|awesome|PR|personal record|felt good|went well)\b/i.test(transcript)) {
    score += 10;
  }

  // Need at least 2 of 3 critical fields
  const criticalCount = [hasIntensity, hasBodyParts, hasMoodEnergy].filter(Boolean).length;
  const canProceed = criticalCount >= 2;

  let message = "";
  if (!canProceed) {
    message = `Missing: ${missing.join(", ")}. Please add at least 2 of these before submitting.`;
  } else if (score < 60) {
    message = "Good start! Consider adding pain check or what went well/poorly.";
  } else {
    message = "Great! This will generate quality insights.";
  }

  return {
    canProceed,
    missing,
    estimatedScore: score,
    message,
  };
}
