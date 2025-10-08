# Workout Assistant Project Setup Guide

This guide provides step-by-step instructions for setting up the Workout Assistant app with Next.js, Shadcn UI, Eleven Labs voice integration, Convex database, and Claude Code agents.

## Table of Contents

1. [Initial Project Setup](#initial-project-setup)
2. [Authentication with Clerk](#authentication-with-clerk)
3. [Convex Database Configuration](#convex-database-configuration)
4. [Eleven Labs Integration](#eleven-labs-integration)
5. [Claude Code Setup](#claude-code-setup)
6. [Environment Variables](#environment-variables)
7. [Development Workflow](#development-workflow)
8. [Deployment Guide](#deployment-guide)

## Initial Project Setup

### Create Next.js Project

```bash
# Create a new Next.js project with TypeScript, Tailwind CSS, and App Router
npx create-next-app@latest workout-assistant --typescript --tailwind --app

# Navigate to project directory
cd workout-assistant

# Install Shadcn UI
npx shadcn-ui@latest init

# Configure Shadcn UI (accept defaults or customize as needed)
# - Styling: Default (recommended)
# - Color: Slate
# - CSS Variables: Yes
# - Global CSS: app/globals.css
# - React Server Components: Yes
# - Components Directory: @/components
# - Utils: @/lib/utils

# Install necessary Shadcn components
npx shadcn-ui@latest add button card avatar dialog sheet tabs form input toast sonner alert badge calendar progress select textarea
```

### Install Dependencies

```bash
# Core dependencies
npm install convex @clerk/nextjs zod date-fns react-day-picker

# Voice and AI dependencies
npm install ai @ai-sdk/eleven elevenlabs-node @anthropic-ai/sdk

# Data visualization
npm install recharts

# Utility libraries
npm install lodash@latest immer lucide-react class-variance-authority tailwind-merge

# Development dependencies
npm install -D eslint-config-prettier prettier
```

### Project Structure

Create the following directory structure:

```
workout-assistant/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── claude/
│   │   │   └── route.ts
│   │   └── eleven/
│   │       └── route.ts
│   ├── dashboard/
│   │   └── page.tsx
│   ├── insights/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── workouts/
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   └── edit/
│   │   │       └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   └── [shadcn components]
│   ├── agents/
│   │   ├── insight-agent.tsx
│   │   ├── training-agent.tsx
│   │   ├── recovery-agent.tsx
│   │   └── voice-agent.tsx
│   ├── auth/
│   │   └── auth-forms.tsx
│   ├── layouts/
│   │   ├── dashboard-shell.tsx
│   │   └── sidebar-nav.tsx
│   ├── workouts/
│   │   ├── workout-card.tsx
│   │   ├── workout-form.tsx
│   │   ├── workout-metrics.tsx
│   │   └── voice-recorder.tsx
│   └── insights/
│       ├── insight-card.tsx
│       └── metrics-visualization.tsx
├── convex/
│   ├── _generated/
│   ├── schema.ts
│   ├── workouts.ts
│   ├── insights.ts
│   ├── agents.ts
│   └── users.ts
├── lib/
│   ├── agents/
│   │   ├── claude.ts
│   │   ├── insight-generator.ts
│   │   ├── training-generator.ts
│   │   └── voice-processor.ts
│   ├── voice/
│   │   ├── recorder.ts
│   │   └── transcription.ts
│   ├── utils.ts
│   └── types.ts
├── public/
│   └── [static assets]
├── .env.local
├── .gitignore
├── convex.json
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Authentication with Clerk

### Setup Clerk

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Add environment variables to your `.env.local` file:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Add Clerk Provider

Update your `app/layout.tsx` file:

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### Create Auth Middleware

Create a `middleware.ts` file in the root directory:

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";
 
export default authMiddleware({
  publicRoutes: ["/", "/api/eleven", "/api/claude", "/login", "/register"]
});
 
export const config = {
  matcher: ["/((?!_next/image|_next/static|favicon.ico).*)"],
};
```

## Convex Database Configuration

### Initialize Convex

```bash
# Install Convex CLI
npm install -g convex

# Initialize Convex in your project
npx convex init
```

### Create Schema

Create a schema in `convex/schema.ts`:

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User data
  users: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(),
    email: v.string(),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      notifications: v.optional(v.boolean()),
      weeklyGoal: v.optional(v.number()),
      primaryGoal: v.optional(v.string())
    })),
    fitnessProfile: v.optional(v.object({
      height: v.optional(v.number()),
      weight: v.optional(v.number()),
      activityLevel: v.optional(v.string()),
      trainingExperience: v.optional(v.string()),
      injuries: v.optional(v.array(v.string())),
    })),
    wearables: v.optional(v.array(v.object({
      provider: v.string(),
      accessToken: v.string(),
      refreshToken: v.optional(v.string()),
      lastSync: v.optional(v.string())
    })))
  })
  .index("by_userId", ["userId"]),
  
  // Workout data
  workouts: defineTable({
    userId: v.string(),
    date: v.string(),
    type: v.optional(v.string()),
    duration: v.number(),
    avgHeartRate: v.number(),
    maxHeartRate: v.optional(v.number()),
    caloriesBurned: v.number(),
    wearableData: v.optional(v.any()), // Raw JSON from wearable
    contextEmbedding: v.optional(v.array(v.float64())), // For voice input
    notes: v.optional(v.string()), // Transcribed voice notes
  })
  .index("by_user_date", ["userId", "date"])
  .vectorIndex("by_context", "contextEmbedding"),
  
  // Insights generated by agents
  insights: defineTable({
    userId: v.string(),
    workoutIds: v.array(v.id("workouts")),
    insightText: v.string(),
    category: v.string(), // "recovery", "performance", "pattern", "warning"
    generatedAt: v.string(),
    confidence: v.optional(v.number()),
    metadata: v.optional(v.any())
  })
  .index("by_user", ["userId"])
  .index("by_workout", ["workoutIds"]),
  
  // Training plans
  trainingPlans: defineTable({
    userId: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    focus: v.string(),
    days: v.array(v.object({
      day: v.string(),
      workoutType: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      duration: v.number(),
      intensity: v.number(),
      exercises: v.array(v.object({
        name: v.string(),
        sets: v.optional(v.number()),
        reps: v.optional(v.string()),
        duration: v.optional(v.string()),
        notes: v.optional(v.string())
      }))
    })),
    notes: v.optional(v.string()),
    generatedAt: v.string()
  })
  .index("by_user_date", ["userId", "startDate"]),
  
  // Conversation history
  conversations: defineTable({
    userId: v.string(),
    role: v.string(), // "user" or "assistant"
    content: v.string(),
    timestamp: v.string(),
    metadata: v.optional(v.any())
  })
  .index("by_user_time", ["userId", "timestamp"])
});
```

### Create API Functions

Create workout functions in `convex/workouts.ts`:

```typescript
// convex/workouts.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get recent workouts
export const getRecentWorkouts = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 10);
  },
});

// Get workout by ID
export const getById = query({
  args: { id: v.id("workouts") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// Create workout
export const createWorkout = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    type: v.optional(v.string()),
    duration: v.number(),
    avgHeartRate: v.number(),
    maxHeartRate: v.optional(v.number()),
    caloriesBurned: v.number(),
    wearableData: v.optional(v.any()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("workouts", {
      userId: args.userId,
      date: args.date,
      type: args.type,
      duration: args.duration,
      avgHeartRate: args.avgHeartRate,
      maxHeartRate: args.maxHeartRate,
      caloriesBurned: args.caloriesBurned,
      wearableData: args.wearableData,
      notes: args.notes
    });
  },
});

// Add context to workout
export const addContext = mutation({
  args: {
    workoutId: v.id("workouts"),
    contextText: v.string()
  },
  handler: async (ctx, args) => {
    // Save text notes
    await ctx.db.patch(args.workoutId, {
      notes: args.contextText
    });
    
    // In a real implementation, you would generate embeddings here
    // For simplicity, we're skipping that step
    
    return args.workoutId;
  },
});

// Search workouts by context
export const searchByContext = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // In a real implementation, you would:
    // 1. Generate embedding for the query
    // 2. Perform vector search
    // For this example, we'll do a simple text search
    
    const allWorkouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Simple text search on notes
    const matchingWorkouts = allWorkouts.filter(workout => 
      workout.notes && workout.notes.toLowerCase().includes(args.query.toLowerCase())
    );
    
    return matchingWorkouts.slice(0, args.limit || 5);
  },
});
```

## Eleven Labs Integration

### Configure Eleven Labs

1. Create an account at [elevenlabs.io](https://elevenlabs.io)
2. Generate an API key
3. Add it to your `.env.local` file:

```
ELEVEN_LABS_API_KEY=your_api_key_here
NEXT_PUBLIC_ELEVEN_LABS_API_KEY=your_api_key_here
```

### Create API Route for Eleven Labs

```typescript
// app/api/eleven/route.ts
import { createAI, streamText } from 'ai';
import { elevenlabs } from '@ai-sdk/eleven/node';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, tools } = await req.json();
  
  // Create an AI instance with ElevenLabs tools
  const ai = createAI({
    tools: { elevenlabs },
    credentials: {
      elevenlabs: { apiKey: process.env.ELEVEN_LABS_API_KEY! }
    }
  });
  
  // Process the request
  const result = await ai.run(messages, tools);
  
  return Response.json(result);
}
```

## Claude Code Setup

### Configure Claude API

1. Create an account at [anthropic.com](https://anthropic.com)
2. Generate an API key
3. Add it to your `.env.local` file:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### Create Claude Client Utility

```typescript
// lib/agents/claude.ts
import { AnthropicClient } from '@anthropic-ai/sdk';

// Initialize the client
export const anthropic = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Helper function for Claude API calls
export async function callClaude({
  model = "claude-3-opus-20240229", 
  messages,
  system,
  max_tokens = 1000,
  temperature = 0.7
}: {
  model?: string;
  messages: Array<{ role: "user" | "assistant"; content: string | object }>;
  system?: string;
  max_tokens?: number;
  temperature?: number;
}) {
  try {
    const response = await anthropic.messages.create({
      model,
      messages,
      system,
      max_tokens,
      temperature,
    });

    return {
      content: response.content[0].text,
      id: response.id,
      model: response.model,
      usage: response.usage
    };
  } catch (error) {
    console.error("Error calling Claude:", error);
    throw new Error(`Failed to process request with Claude: ${error.message}`);
  }
}
```

### Create API Route for Claude

```typescript
// app/api/claude/route.ts
import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/agents/claude';

export async function POST(req: Request) {
  try {
    const { messages, system, model, max_tokens, temperature } = await req.json();
    
    const result = await callClaude({
      messages,
      system,
      model,
      max_tokens,
      temperature
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in Claude API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}
```

## Environment Variables

Create a `.env.local` file in the root directory with all required environment variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud

# Eleven Labs
ELEVEN_LABS_API_KEY=your_eleven_labs_key
NEXT_PUBLIC_ELEVEN_LABS_API_KEY=your_eleven_labs_key

# Anthropic Claude
ANTHROPIC_API_KEY=your_anthropic_key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development Workflow

### Running the Development Server

```bash
# In one terminal, start the Convex development server
npx convex dev

# In another terminal, start the Next.js development server
npm run dev
```

### Working with Convex

1. Make schema changes in `convex/schema.ts`
2. Create API functions in the relevant files (`workouts.ts`, `insights.ts`, etc.)
3. Use the Convex dashboard to inspect your data

### Adding Shadcn UI Components

```bash
# Add new Shadcn UI components as needed
npx shadcn-ui@latest add [component-name]
```

## Deployment Guide

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Create a new project in Vercel
3. Connect your GitHub repository
4. Configure environment variables in the Vercel dashboard
5. Deploy your project

### Deploy Convex Backend

1. Log in to the Convex dashboard
2. Create a production deployment
3. Update your environment variables with the production Convex URL

```bash
# Deploy Convex to production
npx convex deploy
```

4. Copy the production Convex URL and update your Vercel environment variables

### Connect Wearable APIs

For each wearable provider you want to support:

#### Fitbit

1. Create a Fitbit developer account at [dev.fitbit.com](https://dev.fitbit.com)
2. Create a new app with the following settings:
   - OAuth 2.0 Application Type: Client
   - Callback URL: `https://your-app-url.com/api/auth/callback/fitbit`
   - Default Access Type: Read-Only
3. Add the Client ID and Client Secret to your environment variables:

```
FITBIT_CLIENT_ID=your_client_id
FITBIT_CLIENT_SECRET=your_client_secret
```

4. Implement the OAuth flow and API integration

#### Apple Health

For Apple Health, you'll need to use HealthKit in an iOS app that sends data to your backend:

1. Create an iOS app with HealthKit integration
2. Request appropriate permissions in the app
3. Send health data to your API endpoint
4. Process and store the data in your Convex database

#### Garmin

1. Apply for API access at [Garmin Developer Portal](https://developer.garmin.com/)
2. Follow their OAuth implementation guide
3. Add the Consumer Key and Consumer Secret to your environment variables:

```
GARMIN_CONSUMER_KEY=your_consumer_key
GARMIN_CONSUMER_SECRET=your_consumer_secret
```

## Maintenance and Scaling

### Database Backups

Regularly back up your Convex data:

```bash
# Create a backup
npx convex backup create

# List backups
npx convex backup list

# Restore a backup (if needed)
npx convex backup restore your-backup-id
```

### Monitoring and Logging

1. Add error tracking with Sentry:

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs
```

2. Configure Sentry in `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin. Keep empty if
  // you don't want to change the default plugin options
};

module.exports = withSentryConfig(
  nextConfig,
  sentryWebpackPluginOptions
);
```

3. Update your environment variables:

```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Performance Optimization

1. Implement caching for expensive operations:

```typescript
import { LRUCache } from 'lru-cache';

// Create a cache with a maximum of 100 items that expire after 1 hour
const claudeCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60 // 1 hour in milliseconds
});

async function getCachedClaudeResponse(cacheKey, generateResponseFn) {
  // Check cache first
  if (claudeCache.has(cacheKey)) {
    return claudeCache.get(cacheKey);
  }
  
  // Generate response if not in cache
  const response = await generateResponseFn();
  
  // Store in cache
  claudeCache.set(cacheKey, response);
  
  return response;
}
```

2. Optimize images with Next.js Image component:

```tsx
import Image from 'next/image';

// In your components
<Image 
  src="/workout-icon.png" 
  alt="Workout Icon" 
  width={64} 
  height={64} 
  priority 
/>
```

### Security Best Practices

1. Implement rate limiting for API routes:

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

type RateLimitOptions = {
  limit: number;
  window: number; // in seconds
};

export function rateLimit(options: RateLimitOptions = { limit: 10, window: 60 }) {
  const tokenCache = new LRUCache<string, number[]>({
    max: 500,
    ttl: options.window * 1000,
  });

  return async function rateLimiter(req: NextRequest) {
    const ip = req.ip ?? '127.0.0.1';
    const tokens = tokenCache.get(ip) ?? [];
    const now = Date.now();
    
    // Filter out tokens older than the window
    const windowStart = now - options.window * 1000;
    const recentTokens = tokens.filter(timestamp => timestamp > windowStart);
    
    // Check if the rate limit has been exceeded
    if (recentTokens.length >= options.limit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': options.window.toString() } }
      );
    }
    
    // Update tokens
    tokenCache.set(ip, [...recentTokens, now]);
    
    return null; // Allow the request to proceed
  };
}

// Usage in an API route
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ limit: 5, window: 60 });

export async function POST(req: NextRequest) {
  const rateLimitResult = await limiter(req);
  if (rateLimitResult) return rateLimitResult;
  
  // Handle the request...
}
```

2. Sanitize user input:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize user input
const sanitizedInput = DOMPurify.sanitize(userInput);
```

3. Implement proper authentication checks:

```typescript
// convex/workouts.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createWorkout = mutation({
  args: {
    // args here
  },
  handler: async (ctx, args) => {
    // Get authenticated user ID
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    // Ensure the user is creating their own workout
    if (userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    
    // Create workout
    return ctx.db.insert("workouts", {
      // workout data
    });
  },
});
```

## Troubleshooting Common Issues

### Convex Connection Issues

If you're having trouble connecting to Convex:

1. Verify your Convex URL in the environment variables
2. Check that the Convex development server is running
3. Ensure your authentication is properly set up
4. Check for network issues or firewall restrictions

### Authentication Problems

For Clerk authentication issues:

1. Verify your Clerk API keys in the environment variables
2. Check that the Clerk middleware is properly configured
3. Ensure your public routes are correctly specified
4. Verify that your sign-in and sign-up URLs are correctly set

### API Rate Limits

If you hit rate limits with external APIs:

1. Implement caching to reduce API calls
2. Add retry logic with exponential backoff
3. Consider using batch operations instead of individual calls
4. Monitor your API usage and adjust your implementation if needed

### Voice Processing Issues

For Eleven Labs voice processing problems:

1. Check audio format compatibility (Eleven Labs supports WAV and MP3)
2. Ensure audio quality is sufficient
3. Verify your API key and permissions
4. Implement proper error handling for API responses

## Next Steps and Enhancements

### Mobile App Integration

Consider building a mobile app to complement your web application:

1. Use React Native or Flutter for cross-platform development
2. Implement HealthKit and Google Fit integrations directly
3. Add push notifications for insights and reminders

### Advanced Analytics

Enhance your application with more sophisticated analytics:

1. Implement trend analysis over longer time periods
2. Add goal tracking and progress visualization
3. Compare user performance to population benchmarks
4. Predict future performance based on training patterns

### Social Features

Add social elements to encourage engagement:

1. Implement workout sharing
2. Create challenges and competitions
3. Add friend connections and activity feeds
4. Include virtual coaching and community support

### Additional Agent Types

Develop more specialized AI agents:

1. **Goal Setting Agent**: Helps users set realistic fitness goals
2. **Injury Prevention Agent**: Monitors for potential injury risks
3. **Sleep Analysis Agent**: Correlates sleep data with workout performance
4. **Dietary Recommendations Agent**: Provides meal planning based on workout patterns

By following this setup guide, you'll have a robust foundation for your Workout Assistant application with Next.js, Shadcn UI, Eleven Labs voice integration, Convex database, and Claude Code agents.