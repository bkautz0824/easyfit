# Workout Assistant

AI-powered workout tracking and coaching with voice-first interface, built with Next.js, Convex, and Claude.

## Features

- 🎤 **Voice-First Interface**: Log workouts naturally using speech
- 🤖 **AI Coaching**: Claude-powered insights and personalized training plans
- 📊 **Smart Analytics**: Track workouts, heart rate, calories, and progress
- 🔐 **Secure Authentication**: BetterAuth for simple, self-hosted authentication
- 📱 **Modern UI**: Beautiful interface built with Shadcn UI and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Convex (real-time serverless database)
- **Authentication**: BetterAuth (simple, self-hosted)
- **AI**: Anthropic Claude, Eleven Labs Voice
- **UI**: Shadcn UI, Tailwind CSS, Radix UI
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Accounts for:
  - [Convex](https://convex.dev) - Database
  - [Anthropic](https://anthropic.com) - Claude API
  - [Eleven Labs](https://elevenlabs.io) - Voice processing

**Note**: BetterAuth runs directly in your app - no third-party service needed!

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **⚠️ IMPORTANT: Initialize Convex FIRST** (before building):

   Convex must be running to generate TypeScript types:
   ```bash
   npx convex dev
   ```

   Follow the prompts to:
   - Log in to your Convex account
   - Create a new project
   - Copy the `NEXT_PUBLIC_CONVEX_URL` to your `.env.local`

   Keep this terminal running - Convex needs to be active for the app to work.

3. **Set up environment variables**:

   Update your `.env.local` file (a secret has been generated for you already):
   ```bash
   # Authentication (BetterAuth) - already configured!
   BETTER_AUTH_SECRET=wmd9LQ6tybJYrQEjyJPzRvOEZCJHX2X6bKTSBEkcApw=
   BETTER_AUTH_URL=http://localhost:3000

   # Convex - add your URL from step 2
   NEXT_PUBLIC_CONVEX_URL=your_convex_url

   # AI Services - add your keys
   ANTHROPIC_API_KEY=your_anthropic_key
   ELEVEN_LABS_API_KEY=your_elevenlabs_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

**First time setup**: You'll need to register a new account. BetterAuth handles all authentication locally - no external services required!

## Development Workflow

### Running the App

You need **TWO** terminal windows:

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend
npm run dev
```

### Project Structure

```
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API routes (Claude, Eleven Labs)
│   ├── dashboard/         # Main dashboard
│   ├── workouts/          # Workout logging
│   ├── insights/          # AI-generated insights
│   └── settings/          # User settings
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── layouts/          # Layout components
│   ├── workouts/         # Workout-specific components
│   └── insights/         # Insight visualization
├── convex/               # Convex database & functions
│   ├── schema.ts         # Database schema
│   ├── workouts.ts       # Workout CRUD operations
│   ├── insights.ts       # Insights operations
│   └── users.ts          # User management
├── lib/                  # Utilities and helpers
│   ├── agents/          # AI agent logic
│   ├── voice/           # Voice recording & transcription
│   └── types.ts         # TypeScript definitions
└── hooks/               # React hooks
```

## Key Features Explained

### Voice Logging

The voice recorder component uses the Web Audio API to capture audio, which is then sent to Eleven Labs for transcription. Claude processes the transcription to extract structured workout data.

### AI Insights

Claude analyzes your workout history to generate:
- Performance insights
- Recovery recommendations
- Pattern detection
- Warning signals for overtraining

### Training Plans

AI-generated personalized training plans based on:
- Your fitness level
- Recent workout history
- Specified goals (strength, endurance, etc.)
- Available time commitment

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Convex Production

```bash
npx convex deploy
```

Copy the production URL to your Vercel environment variables.

## Troubleshooting

### Convex Connection Issues
- Ensure `npx convex dev` is running
- Check `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
- Verify Convex project is created and accessible

### Authentication Issues
- Verify Clerk API keys
- Check allowed redirect URLs in Clerk dashboard
- Ensure middleware is properly configured

### Voice Recording Issues
- Grant microphone permissions in browser
- Check HTTPS (required for microphone access)
- Verify Eleven Labs API key

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT

## Support

For questions or issues, please refer to the documentation or create an issue in the repository.
