import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get insights for user
export const getInsights = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("insights")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Create insight
export const createInsight = mutation({
  args: {
    userId: v.string(),
    workoutIds: v.array(v.id("workouts")),
    insightText: v.string(),
    category: v.string(),
    generatedAt: v.string(), // Accept generatedAt from caller
    confidence: v.optional(v.number()),
    priority: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        relatedThemes: v.optional(v.array(v.string())),
        relatedBodyParts: v.optional(v.array(v.string())),
        trendData: v.optional(v.any()),
        analysisSnapshot: v.optional(
          v.object({
            totalWorkoutsAnalyzed: v.number(),
            analysisDate: v.string(),
            triggerWorkoutId: v.id("workouts"),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("insights", {
      userId: args.userId,
      workoutIds: args.workoutIds,
      insightText: args.insightText,
      category: args.category,
      generatedAt: args.generatedAt, // Use the provided timestamp
      confidence: args.confidence,
      priority: args.priority,
      metadata: args.metadata,
    });
  },
});
