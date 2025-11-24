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

    // Vector embedding (1536 dimensions from OpenAI)
    embedding: v.array(v.float64()),

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

// Vector search for similar workouts with post-filtering
export const vectorSearch = query({
  args: {
    embedding: v.array(v.float64()),
    userId: v.string(),
    limit: v.optional(v.number()),

    // Pre-filters (applied during vector search - faster)
    workoutType: v.optional(v.string()),
    mood: v.optional(v.string()),

    // Post-filters (applied after vector search - more flexible)
    bodyPart: v.optional(v.string()), // e.g., "knee", "shoulder", "hamstring"
    hasPainPoints: v.optional(v.boolean()), // only workouts with pain mentioned
    minPerceivedExertion: v.optional(v.number()), // e.g., only hard workouts (RPE >= 7)
  },
  handler: async (ctx, args) => {
    const {
      embedding,
      userId,
      limit = 20, // Fetch more initially for post-filtering
      workoutType,
      mood,
      bodyPart,
      hasPainPoints,
      minPerceivedExertion,
    } = args;

    // PRE-FILTER: Applied during vector search (fast, but limited to indexed fields)
    const results = await ctx.db
      .query("workoutContext")
      .withIndex("by_embedding", (q) =>
        q.similar("embedding", embedding, limit * 2) // Fetch 2x for post-filtering
      )
      .filter((q) => {
        let filterExpression = q.eq("userId", userId);
        if (workoutType) {
          filterExpression = q.and(filterExpression, q.eq("workoutType", workoutType));
        }
        if (mood) {
          filterExpression = q.and(filterExpression, q.eq("mood", mood));
        }
        return filterExpression;
      })
      .collect();

    // POST-FILTER: Applied in-memory (flexible, but slower)
    let filteredResults = results;

    // Filter by body part mentioned
    if (bodyPart) {
      filteredResults = filteredResults.filter((context) =>
        context.bodyParts?.some((part) =>
          part.toLowerCase().includes(bodyPart.toLowerCase())
        )
      );
    }

    // Filter for workouts with pain points
    if (hasPainPoints) {
      filteredResults = filteredResults.filter(
        (context) => context.painPoints && context.painPoints.length > 0
      );
    }

    // Filter by minimum RPE
    if (minPerceivedExertion !== undefined) {
      filteredResults = filteredResults.filter(
        (context) =>
          context.perceivedExertion !== undefined &&
          context.perceivedExertion >= minPerceivedExertion
      );
    }

    // Limit results after filtering
    filteredResults = filteredResults.slice(0, limit);

    // Fetch associated workout data (objective metrics)
    const contextsWithWorkouts = await Promise.all(
      filteredResults.map(async (context) => {
        const workout = await ctx.db.get(context.workoutId);
        return {
          context,
          workout,
        };
      })
    );

    return contextsWithWorkouts;
  },
});

// Dedicated body part search (when you know exactly what you want)
export const searchByBodyPart = query({
  args: {
    userId: v.string(),
    bodyPart: v.string(), // e.g., "knee", "shoulder", "hamstring"
    workoutType: v.optional(v.string()),
    sortBy: v.optional(v.string()), // "date", "pain_severity" (based on painPoints count)
  },
  handler: async (ctx, args) => {
    const { userId, bodyPart, workoutType, sortBy = "date" } = args;

    // Get all contexts for this user
    const contexts = await ctx.db
      .query("workoutContext")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter by body part
    let filtered = contexts.filter((context) => {
      const hasBodyPart = context.bodyParts?.some((part) =>
        part.toLowerCase().includes(bodyPart.toLowerCase())
      );

      const matchesType = !workoutType || context.workoutType === workoutType;

      return hasBodyPart && matchesType;
    });

    // Sort results
    if (sortBy === "pain_severity") {
      filtered.sort((a, b) => {
        const aPainCount = a.painPoints?.length || 0;
        const bPainCount = b.painPoints?.length || 0;
        return bPainCount - aPainCount; // Descending (most pain first)
      });
    } else {
      // Sort by date (most recent first)
      filtered.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Fetch associated workout data
    const contextsWithWorkouts = await Promise.all(
      filtered.map(async (context) => {
        const workout = await ctx.db.get(context.workoutId);
        return {
          context,
          workout,
          painPointCount: context.painPoints?.length || 0,
        };
      })
    );

    return contextsWithWorkouts;
  },
});
