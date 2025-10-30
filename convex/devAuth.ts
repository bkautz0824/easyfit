// Development-only authentication bypass
// Creates a hardcoded test user for development

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEV_USER = {
  email: "dev@test.com",
  name: "Dev User",
  userId: "dev-user-123",
};

// Create or get the dev user
export const getOrCreateDevUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if dev user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), DEV_USER.email))
      .first();

    if (existingUser) {
      return {
        userId: existingUser._id,
        email: existingUser.email,
        name: existingUser.name,
      };
    }

    // Create new dev user
    const userId = await ctx.db.insert("users", {
      email: DEV_USER.email,
      name: DEV_USER.name,
      emailVerificationTime: Date.now(),
      isAnonymous: false,
    });

    // Create user profile
    await ctx.db.insert("userProfiles", {
      userId: userId,
      preferences: {
        theme: "dark",
        notifications: true,
        weeklyGoal: 4,
        primaryGoal: "general fitness",
      },
    });

    return {
      userId,
      email: DEV_USER.email,
      name: DEV_USER.name,
    };
  },
});

// Get current dev user
export const getDevUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), DEV_USER.email))
      .first();

    if (!user) return null;

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
    };
  },
});
