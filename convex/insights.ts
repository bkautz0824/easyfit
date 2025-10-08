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
    generatedAt: v.string(),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("insights", {
      userId: args.userId,
      workoutIds: args.workoutIds,
      insightText: args.insightText,
      category: args.category,
      generatedAt: args.generatedAt,
      confidence: args.confidence,
    });
  },
});
