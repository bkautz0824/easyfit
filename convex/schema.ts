import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex Auth tables (automatically managed)
  // This includes a users table with name, email, emailVerified, image, etc.
  ...authTables,

  // Extended user profile data (linked to auth users)
  userProfiles: defineTable({
    userId: v.string(), // Links to auth user ID (ctx.auth.getUserIdentity().subject)
    preferences: v.optional(
      v.object({
        theme: v.optional(v.string()),
        notifications: v.optional(v.boolean()),
        weeklyGoal: v.optional(v.number()),
        primaryGoal: v.optional(v.string()),
      })
    ),
    fitnessProfile: v.optional(
      v.object({
        height: v.optional(v.number()),
        weight: v.optional(v.number()),
        activityLevel: v.optional(v.string()),
        trainingExperience: v.optional(v.string()),
        injuries: v.optional(v.array(v.string())),
      })
    ),
    wearables: v.optional(
      v.array(
        v.object({
          provider: v.string(),
          accessToken: v.string(),
          refreshToken: v.optional(v.string()),
          lastSync: v.optional(v.string()),
        })
      )
    ),
  }).index("by_userId", ["userId"]),

  // Workout data - OBJECTIVE metrics from wearables (Traditional DB)
  workouts: defineTable({
    userId: v.string(),
    date: v.string(),
    status: v.string(), // "unresolved", "resolving", "resolved"

    // Duration and timing
    duration: v.number(), // minutes
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),

    // Heart Rate Data (from wearable)
    avgHeartRate: v.number(),
    maxHeartRate: v.optional(v.number()),
    minHeartRate: v.optional(v.number()),
    hrZones: v.optional(v.object({
      zone1: v.optional(v.number()), // % time in zone
      zone2: v.optional(v.number()),
      zone3: v.optional(v.number()),
      zone4: v.optional(v.number()),
      zone5: v.optional(v.number()),
    })),

    // Energy metrics (from wearable)
    caloriesBurned: v.number(),
    trainingLoad: v.optional(v.number()), // calculated from HR/power

    // Distance and Speed (from wearable)
    distance: v.optional(v.number()), // km
    avgPace: v.optional(v.string()), // min/km
    avgSpeed: v.optional(v.number()), // km/h

    // Cycling specific (from wearable)
    avgPower: v.optional(v.number()), // watts
    maxPower: v.optional(v.number()),
    normalizedPower: v.optional(v.number()),
    cadence: v.optional(v.number()), // rpm

    // Running specific (from wearable)
    avgCadence: v.optional(v.number()), // steps per minute
    strideLength: v.optional(v.number()), // meters
    verticalOscillation: v.optional(v.number()), // cm
    groundContactTime: v.optional(v.number()), // ms

    // Elevation (from wearable)
    elevationGain: v.optional(v.number()), // meters
    elevationLoss: v.optional(v.number()),

    // Swimming specific (from wearable)
    strokeCount: v.optional(v.number()),
    swimPace: v.optional(v.string()), // min/100m
    swolf: v.optional(v.number()),

    // Wearable source
    wearableSource: v.optional(v.string()), // "apple", "garmin", "coros", "fitbit", "polar"
    wearableData: v.optional(v.string()), // raw JSON as string for debugging

    // Metadata
    resolvedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_user_status", ["userId", "status"]),

  // Workout context - SUBJECTIVE data from voice (Claude-extracted, searchable)
  workoutContext: defineTable({
    workoutId: v.id("workouts"), // Link to objective data
    userId: v.string(),

    // RAW voice data (always preserved)
    voiceTranscript: v.string(), // Full transcription - never deleted

    // AI-EXTRACTED core classification
    workoutType: v.optional(v.string()), // "run", "bike", "swim", "strength" - from speech
    workoutSubType: v.optional(v.string()), // "tempo", "intervals", "recovery", "long", "fartlek"

    // Perceived metrics
    perceivedExertion: v.optional(v.number()), // RPE 1-10 scale
    mood: v.optional(v.string()), // "great", "tired", "stressed", "motivated"
    energyLevel: v.optional(v.string()), // "high", "medium", "low"

    // Semantic tags for searchability (Claude-extracted)
    themes: v.optional(v.array(v.string())), // ["struggled with pace", "recovery focused", "felt strong"]
    bodyParts: v.optional(v.array(v.string())), // ["knee", "hamstring", "lower back", "shoulders"]
    feelings: v.optional(v.array(v.string())), // ["exhausted", "energized", "sore", "powerful"]
    keywords: v.optional(v.array(v.string())), // ["hill repeats", "new PR", "race prep", "easy spin"]

    // Specific observations (Claude-extracted)
    painPoints: v.optional(v.array(v.string())), // ["left knee pain on downhills", "tight right calf"]
    positiveAspects: v.optional(v.array(v.string())), // ["strong finish", "maintained pace", "good form"]
    challenges: v.optional(v.array(v.string())), // ["struggled in heat", "difficulty breathing", "pacing too fast"]

    // Contextual factors
    weatherImpact: v.optional(v.string()), // "hot and humid affected performance"
    equipmentNotes: v.optional(v.string()), // "new shoes caused blister on right heel"
    routeNotes: v.optional(v.string()), // "hilly course, more elevation than usual"
    nutritionNotes: v.optional(v.string()), // "didn't eat enough before, felt depleted"
    sleepQuality: v.optional(v.string()), // "poor sleep last night, felt impact"

    // AI-generated insights
    aiSummary: v.string(), // Claude's 2-3 sentence intelligent summary
    trainingRecommendation: v.optional(v.string()), // Claude's suggestion for next workout

    // Metadata
    createdAt: v.string(),
  })
    .index("by_workout", ["workoutId"])
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "workoutType"])
    .index("by_user_subtype", ["userId", "workoutSubType"]),

  // Insights generated by agents
  insights: defineTable({
    userId: v.string(),
    workoutIds: v.array(v.id("workouts")),
    insightText: v.string(),
    category: v.string(), // "recovery", "performance", "pattern", "warning"
    generatedAt: v.string(),
    confidence: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_workout", ["workoutIds"]),

  // Training plans
  trainingPlans: defineTable({
    userId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    focus: v.string(),
    days: v.array(
      v.object({
        day: v.string(),
        workoutType: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        duration: v.number(),
        intensity: v.number(),
        exercises: v.array(
          v.object({
            name: v.string(),
            sets: v.optional(v.number()),
            reps: v.optional(v.string()),
            duration: v.optional(v.string()),
            notes: v.optional(v.string()),
          })
        ),
      })
    ),
    notes: v.optional(v.string()),
    generatedAt: v.string(),
  }).index("by_user_date", ["userId", "startDate"]),

  // Conversation history
  conversations: defineTable({
    userId: v.string(),
    role: v.string(), // "user" or "assistant"
    content: v.string(),
    timestamp: v.string(),
  }).index("by_user_time", ["userId", "timestamp"]),
});
