import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get context for a specific workout
export const getByWorkout = query({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("workoutContext")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .first();
  },
});

// Create workout context (after Claude processing)
export const createContext = mutation({
  args: {
    workoutId: v.id("workouts"),
    userId: v.string(),

    // Raw data
    voiceTranscript: v.string(),

    // Extracted data
    workoutType: v.optional(v.string()),
    workoutSubType: v.optional(v.string()),
    perceivedExertion: v.optional(v.number()),
    mood: v.optional(v.string()),
    energyLevel: v.optional(v.string()),

    // Semantic tags
    themes: v.optional(v.array(v.string())),
    bodyParts: v.optional(v.array(v.string())),
    feelings: v.optional(v.array(v.string())),
    keywords: v.optional(v.array(v.string())),

    // Observations
    painPoints: v.optional(v.array(v.string())),
    positiveAspects: v.optional(v.array(v.string())),
    challenges: v.optional(v.array(v.string())),

    // Context
    weatherImpact: v.optional(v.string()),
    equipmentNotes: v.optional(v.string()),
    routeNotes: v.optional(v.string()),
    nutritionNotes: v.optional(v.string()),
    sleepQuality: v.optional(v.string()),

    // AI insights
    aiSummary: v.string(),
    trainingRecommendation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Note: Auth check disabled for dev user bypass
    // TODO: Re-enable when proper auth is implemented
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error("Not authenticated");
    // }

    return ctx.db.insert("workoutContext", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

// Search by themes (semantic search without vectors!)
export const searchByThemes = query({
  args: {
    userId: v.string(),
    themeKeyword: v.string(), // e.g., "struggled", "strong", "recovery"
  },
  handler: async (ctx, args) => {
    const contexts = await ctx.db
      .query("workoutContext")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return contexts.filter((c) =>
      c.themes?.some((theme) =>
        theme.toLowerCase().includes(args.themeKeyword.toLowerCase())
      )
    );
  },
});

// Find workouts by body part (injury tracking)
export const findByBodyPart = query({
  args: {
    userId: v.string(),
    bodyPart: v.string(), // e.g., "knee", "hamstring"
  },
  handler: async (ctx, args) => {
    const contexts = await ctx.db
      .query("workoutContext")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return contexts.filter((c) =>
      c.bodyParts?.some((part) =>
        part.toLowerCase().includes(args.bodyPart.toLowerCase())
      )
    );
  },
});

// Find by feeling
export const findByFeeling = query({
  args: {
    userId: v.string(),
    feeling: v.string(), // e.g., "tired", "energized", "sore"
  },
  handler: async (ctx, args) => {
    const contexts = await ctx.db
      .query("workoutContext")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return contexts.filter((c) =>
      c.feelings?.some((f) =>
        f.toLowerCase().includes(args.feeling.toLowerCase())
      )
    );
  },
});

// Find by keyword (training terminology)
export const findByKeyword = query({
  args: {
    userId: v.string(),
    keyword: v.string(), // e.g., "intervals", "tempo", "hill"
  },
  handler: async (ctx, args) => {
    const contexts = await ctx.db
      .query("workoutContext")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return contexts.filter((c) =>
      c.keywords?.some((kw) =>
        kw.toLowerCase().includes(args.keyword.toLowerCase())
      )
    );
  },
});

// Find workouts with pain points
export const findWithPain = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const contexts = await ctx.db
      .query("workoutContext")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return contexts.filter((c) => c.painPoints && c.painPoints.length > 0);
  },
});

// Full text search on raw transcript
export const searchTranscript = query({
  args: {
    userId: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const contexts = await ctx.db
      .query("workoutContext")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return contexts.filter((c) =>
      c.voiceTranscript.toLowerCase().includes(args.searchTerm.toLowerCase())
    );
  },
});

// Get workout with full context (objective + subjective)
export const getWorkoutWithContext = query({
  args: {
    workoutId: v.id("workouts"),
  },
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    const context = await ctx.db
      .query("workoutContext")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .first();

    return {
      ...workout,
      context,
    };
  },
});
