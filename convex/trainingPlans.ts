import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get training plans for user
export const getTrainingPlans = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("trainingPlans")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get training plan by ID
export const getById = query({
  args: { id: v.id("trainingPlans") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// Create training plan
export const createTrainingPlan = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return ctx.db.insert("trainingPlans", {
      userId: args.userId,
      startDate: args.startDate,
      endDate: args.endDate,
      focus: args.focus,
      days: args.days,
      notes: args.notes,
      generatedAt: args.generatedAt,
    });
  },
});
