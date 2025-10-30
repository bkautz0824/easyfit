// Seed script to populate database with unresolved wearable workout data
// This simulates workouts synced from wearables that need context added via voice
// Run with: npx convex run seedData:seedWearableWorkouts --userId "YOUR_USER_ID"

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedWearableWorkouts = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Helper to create date strings (X days ago)
    const daysAgo = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date.toISOString();
    };

    // Realistic unresolved workouts from wearables
    const wearableWorkouts = [
      // Today's morning run
      {
        date: daysAgo(0),
        duration: 45,
        avgHeartRate: 152,
        maxHeartRate: 178,
        minHeartRate: 68,
        caloriesBurned: 487,
        distance: 8.5,
        avgPace: "5:18",
        avgSpeed: 11.3,
        wearableSource: "apple",
        startTime: "06:30:00",
        endTime: "07:15:00",
      },
      // Yesterday evening run
      {
        date: daysAgo(1),
        duration: 35,
        avgHeartRate: 145,
        maxHeartRate: 165,
        minHeartRate: 72,
        caloriesBurned: 352,
        distance: 6.2,
        avgPace: "5:39",
        avgSpeed: 10.6,
        wearableSource: "apple",
        startTime: "18:00:00",
        endTime: "18:35:00",
      },
      // 2 days ago - easy recovery
      {
        date: daysAgo(2),
        duration: 30,
        avgHeartRate: 132,
        maxHeartRate: 148,
        minHeartRate: 65,
        caloriesBurned: 285,
        distance: 5.0,
        avgPace: "6:00",
        avgSpeed: 10.0,
        wearableSource: "garmin",
        startTime: "07:00:00",
        endTime: "07:30:00",
      },
      // 3 days ago - morning jog
      {
        date: daysAgo(3),
        duration: 25,
        avgHeartRate: 128,
        maxHeartRate: 142,
        minHeartRate: 62,
        caloriesBurned: 225,
        distance: 4.2,
        avgPace: "5:57",
        avgSpeed: 10.08,
        wearableSource: "apple",
        startTime: "06:45:00",
        endTime: "07:10:00",
      },
      // 4 days ago - tempo run
      {
        date: daysAgo(4),
        duration: 40,
        avgHeartRate: 168,
        maxHeartRate: 182,
        minHeartRate: 78,
        caloriesBurned: 465,
        distance: 7.5,
        avgPace: "5:20",
        avgSpeed: 11.25,
        wearableSource: "apple",
        startTime: "06:15:00",
        endTime: "06:55:00",
      },
    ];

    const createdWorkoutIds = [];

    // Insert all workouts as "unresolved" (needs context)
    for (const workout of wearableWorkouts) {
      const workoutId = await ctx.db.insert("workouts", {
        userId,
        date: workout.date,
        status: "unresolved", // All need voice context
        duration: workout.duration,
        avgHeartRate: workout.avgHeartRate,
        maxHeartRate: workout.maxHeartRate,
        minHeartRate: workout.minHeartRate,
        caloriesBurned: workout.caloriesBurned,
        distance: workout.distance,
        avgPace: workout.avgPace,
        avgSpeed: workout.avgSpeed,
        wearableSource: workout.wearableSource,
        startTime: workout.startTime,
        endTime: workout.endTime,
        createdAt: workout.date,
      });

      createdWorkoutIds.push(workoutId);
    }

    return {
      success: true,
      message: `Created ${createdWorkoutIds.length} unresolved wearable workouts`,
      workoutIds: createdWorkoutIds,
      nextStep: "Go to /dashboard to add voice context to these workouts",
    };
  },
});

// Helper to clear all workouts for a user (useful for testing)
export const clearUserWorkouts = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Delete all workouts
    const workouts = await ctx.db
      .query("workouts")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    for (const workout of workouts) {
      await ctx.db.delete(workout._id);
    }

    // Delete all contexts
    const contexts = await ctx.db
      .query("workoutContext")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    for (const context of contexts) {
      await ctx.db.delete(context._id);
    }

    return {
      success: true,
      message: `Cleared ${workouts.length} workouts and ${contexts.length} contexts`,
    };
  },
});
