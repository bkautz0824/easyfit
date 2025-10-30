import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get unresolved workouts (need voice context)
export const getUnresolvedWorkouts = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("workouts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "unresolved")
      )
      .order("desc")
      .collect();
  },
});

// Get resolved workouts (for timeline)
export const getResolvedWorkouts = query({
  args: {
    userId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "resolved")
      )
      .order("desc")
      .collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      workouts = workouts.filter((w) => {
        const workoutDate = new Date(w.date);
        if (args.startDate && workoutDate < new Date(args.startDate)) {
          return false;
        }
        if (args.endDate && workoutDate > new Date(args.endDate)) {
          return false;
        }
        return true;
      });
    }

    return workouts;
  },
});

// Get workout by ID
export const getById = query({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// Create workout (from wearable sync)
export const createWorkout = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    type: v.optional(v.string()),
    status: v.string(),
    duration: v.number(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),

    // Heart rate
    avgHeartRate: v.number(),
    maxHeartRate: v.optional(v.number()),
    minHeartRate: v.optional(v.number()),
    hrZones: v.optional(v.object({
      zone1: v.optional(v.number()),
      zone2: v.optional(v.number()),
      zone3: v.optional(v.number()),
      zone4: v.optional(v.number()),
      zone5: v.optional(v.number()),
    })),

    // Energy
    caloriesBurned: v.number(),
    trainingLoad: v.optional(v.number()),
    intensity: v.optional(v.string()),

    // Distance/Speed
    distance: v.optional(v.number()),
    avgPace: v.optional(v.string()),
    avgSpeed: v.optional(v.number()),

    // Cycling
    avgPower: v.optional(v.number()),
    maxPower: v.optional(v.number()),
    normalizedPower: v.optional(v.number()),
    cadence: v.optional(v.number()),

    // Running
    avgCadence: v.optional(v.number()),
    strideLength: v.optional(v.number()),
    verticalOscillation: v.optional(v.number()),
    groundContactTime: v.optional(v.number()),

    // Elevation
    elevationGain: v.optional(v.number()),
    elevationLoss: v.optional(v.number()),

    // Swimming
    strokeCount: v.optional(v.number()),
    swimPace: v.optional(v.string()),
    swolf: v.optional(v.number()),

    // Wearable
    wearableSource: v.optional(v.string()),
    wearableData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return ctx.db.insert("workouts", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

// Add subjective context (voice input)
export const addSubjectiveContext = mutation({
  args: {
    workoutId: v.id("workouts"),
    subjectiveNotes: v.string(),
    perceivedExertion: v.optional(v.number()),
    mood: v.optional(v.string()),
    energyLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { workoutId, ...updates } = args;

    await ctx.db.patch(workoutId, {
      ...updates,
      status: "resolved",
      resolvedAt: new Date().toISOString(),
    });

    return workoutId;
  },
});

// Update workout status
export const updateStatus = mutation({
  args: {
    workoutId: v.id("workouts"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: Auth check disabled for dev user bypass
    // TODO: Re-enable when proper auth is implemented
    // const identity = await ctx.auth.getUserIdentity();
    // if (!identity) {
    //   throw new Error("Not authenticated");
    // }

    await ctx.db.patch(args.workoutId, {
      status: args.status,
    });

    return args.workoutId;
  },
});

// Delete workout
export const deleteWorkout = mutation({
  args: {
    id: v.id("workouts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(args.id);
  },
});

// Get training load stats for a date range
export const getTrainingLoadStats = query({
  args: {
    userId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();

    const filtered = workouts.filter((w) => {
      const date = new Date(w.date);
      return (
        date >= new Date(args.startDate) &&
        date <= new Date(args.endDate) &&
        w.status === "resolved"
      );
    });

    const totalLoad = filtered.reduce(
      (sum, w) => sum + (w.trainingLoad || 0),
      0
    );
    const avgLoad = filtered.length > 0 ? totalLoad / filtered.length : 0;

    const byDay = filtered.reduce((acc, w) => {
      const day = w.date.split("T")[0];
      if (!acc[day]) {
        acc[day] = { count: 0, totalLoad: 0 };
      }
      acc[day].count++;
      acc[day].totalLoad += w.trainingLoad || 0;
      return acc;
    }, {} as Record<string, { count: number; totalLoad: number }>);

    return {
      totalWorkouts: filtered.length,
      totalLoad,
      avgLoad,
      byDay,
    };
  },
});
