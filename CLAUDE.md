# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Workout Assistant** is a fitness tracking application built with Next.js that features AI-powered coaching, voice interactions via Eleven Labs, and wearable device integration. The app uses Convex for the database, Clerk for authentication, Claude for AI coaching agents, and Shadcn UI for components.

## Technology Stack

- **Framework**: Next.js (App Router with TypeScript)
- **UI**: Shadcn UI + Tailwind CSS
- **Database**: Convex (serverless real-time database)
- **Authentication**: BetterAuth (self-hosted, simple)
- **AI/Voice**:
  - Anthropic Claude for coaching agents
  - Eleven Labs for voice-to-text and speech synthesis
  - Vercel AI SDK
- **Styling**: Tailwind CSS, Framer Motion for animations

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Initialize Shadcn UI (if not already done)
npx shadcn-ui@latest init

# Add Shadcn components
npx shadcn-ui@latest add [component-name]
```

### Running Development Servers

**IMPORTANT**: You need TWO terminal windows running simultaneously:

```bash
# Terminal 1: Start Convex development server (MUST run first)
npx convex dev

# Terminal 2: Start Next.js development server
npm run dev
```

### Database Operations

```bash
# Deploy Convex to production
npx convex deploy

# Create database backup
npx convex backup create

# List backups
npx convex backup list

# Restore backup
npx convex backup restore [backup-id]
```

## Project Architecture

### Directory Structure

```
app/
├── (auth)/              # Authentication pages (login, register)
├── api/
│   ├── claude/         # Claude AI API endpoints
│   └── eleven/         # Eleven Labs voice API endpoints
├── dashboard/          # Main dashboard view
├── insights/           # AI-generated insights page
├── settings/           # User settings
└── workouts/           # Workout management pages

components/
├── ui/                 # Shadcn UI components
├── agents/             # AI agent components (insight, training, recovery, voice)
├── auth/               # Authentication forms
├── layouts/            # Layout components (dashboard shell, sidebar)
├── workouts/           # Workout-related components (cards, forms, metrics)
└── insights/           # Insight visualization components

convex/
├── schema.ts           # Convex database schema
├── workouts.ts         # Workout CRUD operations
├── insights.ts         # Insights operations
├── agents.ts           # Agent-related operations
└── users.ts            # User management

lib/
├── agents/
│   ├── claude.ts                # Claude API client and helpers
│   ├── insight-generator.ts     # Insight generation logic
│   ├── training-generator.ts    # Training plan generation
│   └── voice-processor.ts       # Voice processing utilities
├── voice/
│   ├── recorder.ts              # Voice recording utilities
│   └── transcription.ts         # Speech-to-text processing
├── utils.ts                      # General utilities
└── types.ts                      # TypeScript type definitions
```

### Key Architectural Patterns

#### Convex Database Schema

The app uses Convex with the following core tables:
- **users**: User profiles, preferences, fitness profile, wearable connections
- **workouts**: Workout data with heart rate, duration, calories, notes, and embeddings for semantic search
- **insights**: AI-generated insights linked to workouts
- **trainingPlans**: Structured training plans with daily exercises
- **conversations**: Chat history with AI agents

#### Voice Processing Flow

1. User records audio via browser
2. Audio sent to `/api/eleven` endpoint
3. Eleven Labs transcribes to text
4. Text processed by Claude for workout logging
5. Structured data saved to Convex
6. Optional: Generate voice response via Eleven Labs TTS

#### AI Agent Architecture

Multiple specialized agents:
- **Insight Agent**: Analyzes workout patterns, generates performance insights
- **Training Agent**: Creates personalized training plans
- **Recovery Agent**: Monitors recovery metrics, suggests rest
- **Voice Agent**: Handles voice interactions, natural language workout logging

All agents use Claude via the unified `callClaude()` helper in `lib/agents/claude.ts`.

#### Wearable Integration Strategy

- OAuth flows for each provider (Fitbit, Garmin, etc.)
- Store access tokens securely in Convex `users.wearables` array
- Periodic sync jobs fetch latest workout data
- Merge wearable data with user-provided context

## Required Environment Variables

```bash
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

## Key Implementation Notes

### Authentication & Authorization

- BetterAuth handles authentication with session cookies
- Middleware checks for `better-auth.session_token` cookie
- Public routes: `/`, `/login`, `/register`, `/api/auth/*`
- API routes verify session:
  ```typescript
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```
- All Convex mutations should verify user identity:
  ```typescript
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  ```

### Convex Queries vs Mutations

- **Queries**: Read-only, automatically reactive, can be used in React components
- **Mutations**: Write operations, must be called explicitly
- Use indexes for efficient querying (e.g., `by_user_date`, `by_userId`)

### Vector Search for Workouts

- Workouts have optional `contextEmbedding` field for semantic search
- Implementation currently uses text search as placeholder
- Future: Generate embeddings from workout notes, enable vector search

### API Route Patterns

All API routes should:
1. Validate authentication (use Clerk's `getAuth()`)
2. Parse and validate request body
3. Call appropriate service/agent function
4. Return proper error responses with status codes
5. Use `NextResponse.json()` for responses

### Error Handling

- Implement try-catch in all API routes
- Log errors with context for debugging
- Return user-friendly error messages
- Consider adding Sentry for production error tracking

## Common Development Tasks

### Adding a New Shadcn Component
```bash
npx shadcn-ui@latest add [component-name]
# Component appears in components/ui/
```

### Creating a New Convex Table

1. Add table definition to `convex/schema.ts`
2. Add indexes for efficient queries
3. Create API functions file (e.g., `convex/newTable.ts`)
4. Define queries and mutations using Convex SDK
5. Convex dev server auto-detects changes

### Adding a New AI Agent

1. Create agent component in `components/agents/`
2. Create agent logic in `lib/agents/`
3. Use `callClaude()` helper for API calls
4. Add system prompt tailored to agent's purpose
5. Stream responses for better UX

### Integrating a New Wearable Provider

1. Register app with provider's developer portal
2. Implement OAuth flow in `app/api/wearables/[provider]/`
3. Store tokens in Convex `users.wearables`
4. Create sync function to fetch workout data
5. Transform provider data to app's workout schema

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Convex Production Deployment
```bash
npx convex deploy
# Copy production URL to Vercel environment variables
```

## Testing Strategy

The setup guide mentions test commands but they're not yet implemented:
```bash
npm run test              # Unit/integration tests (TODO)
npm run test:ai           # AI agent tests (TODO)
npm run test:voice        # Voice processing tests (TODO)
```

## Performance Considerations

- Implement caching for expensive Claude API calls
- Use Next.js Image component for optimized images
- Consider rate limiting on API routes (especially AI endpoints)
- Monitor API usage to avoid hitting rate limits
- Use edge functions for low-latency responses

## Security Best Practices

- Never commit API keys (use environment variables)
- Validate user authorization in all Convex mutations
- Sanitize user input before storing or displaying
- Implement rate limiting on public API endpoints
- Use Clerk's authentication middleware consistently
