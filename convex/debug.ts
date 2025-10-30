import { query } from "./_generated/server";
import { v } from "convex/values";

// Debug query to check all workouts for a user
export const getAllWorkoutsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const contexts = await ctx.db
      .query("workoutContext")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return {
      totalWorkouts: workouts.length,
      unresolvedCount: workouts.filter((w) => w.status === "unresolved").length,
      resolvedCount: workouts.filter((w) => w.status === "resolved").length,
      contextsCount: contexts.length,
      workouts: workouts.map((w) => ({
        id: w._id,
        date: w.date,
        status: w.status,
        duration: w.duration,
        avgHeartRate: w.avgHeartRate,
        distance: w.distance,
      })),
      contexts: contexts.map((c) => ({
        workoutId: c.workoutId,
        hasTranscript: !!c.voiceTranscript,
        themes: c.themes,
        painPoints: c.painPoints,
      })),
    };
  },
});
