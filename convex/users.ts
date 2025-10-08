import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get current authenticated user
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return {
      name: identity.name,
      email: identity.email,
      userId: identity.subject,
    };
  },
});

// Get user profile by user ID
export const getUserProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Create or update user profile
export const upsertUserProfile = mutation({
  args: {
    userId: v.string(),
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const data = {
      userId: args.userId,
      ...(args.preferences && { preferences: args.preferences }),
      ...(args.fitnessProfile && { fitnessProfile: args.fitnessProfile }),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return ctx.db.insert("userProfiles", data);
  },
});

// Update user preferences
export const updatePreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      theme: v.optional(v.string()),
      notifications: v.optional(v.boolean()),
      weeklyGoal: v.optional(v.number()),
      primaryGoal: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      // Create profile if it doesn't exist
      return ctx.db.insert("userProfiles", {
        userId: args.userId,
        preferences: args.preferences,
      });
    }

    await ctx.db.patch(profile._id, {
      preferences: args.preferences,
    });

    return profile._id;
  },
});

// Update fitness profile
export const updateFitnessProfile = mutation({
  args: {
    userId: v.string(),
    fitnessProfile: v.object({
      height: v.optional(v.number()),
      weight: v.optional(v.number()),
      activityLevel: v.optional(v.string()),
      trainingExperience: v.optional(v.string()),
      injuries: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      // Create profile if it doesn't exist
      return ctx.db.insert("userProfiles", {
        userId: args.userId,
        fitnessProfile: args.fitnessProfile,
      });
    }

    await ctx.db.patch(profile._id, {
      fitnessProfile: args.fitnessProfile,
    });

    return profile._id;
  },
});
