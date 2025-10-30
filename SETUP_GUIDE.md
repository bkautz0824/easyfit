# Workout Assistant - Setup Guide

## Complete Voice → AI → Vector → Insights Pipeline

This guide walks you through setting up the full pipeline: Voice recording → OpenAI Whisper transcription → Claude AI extraction → Pinecone vector search → Insights generation.

---

## Prerequisites

1. **OpenAI Account** - For Whisper (STT) and text embeddings
2. **Anthropic Account** - For Claude AI (context extraction)
3. **Pinecone Account** - For vector search (semantic similarity)
4. **Convex Account** - Already configured

---

## Step 1: OpenAI API Setup

### 1.1 Create API Key

1. Go to https://platform.openai.com/api-keys
2. Click "+ Create new secret key"
3. Name it "Workout Assistant - Dev"
4. Copy the key (starts with `sk-`)

### 1.2 Add to Environment

Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-proj-...your-key-here
```

### 1.3 Costs

- **Whisper STT**: $0.006 per minute
- **Embeddings**: $0.02 per 1M tokens (~$0.0001 per workout)
- **Monthly estimate** (100 workouts): ~$1.50

---

## Step 2: Pinecone Setup

### 2.1 Create Free Account

1. Go to https://www.pinecone.io/
2. Sign up for free (no credit card required)
3. Verify your email

### 2.2 Create Index

1. Click "Create Index"
2. Configure:
   - **Name**: `workouts`
   - **Dimensions**: `1536` (for text-embedding-3-small)
   - **Metric**: `cosine`
   - **Cloud**: `AWS` (default)
   - **Region**: `us-west1-gcp` or nearest
3. Click "Create Index"

### 2.3 Get API Key

1. Go to "API Keys" in left sidebar
2. Copy your API key
3. Note your environment (e.g., `us-west1-gcp`)

### 2.4 Add to Environment

Add to `.env.local`:
```bash
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=workouts
```

### 2.5 Free Tier Limits

- ✅ 1 index
- ✅ 100,000 vectors
- ✅ Unlimited queries
- ✅ Perfect for MVP!

---

## Step 3: Verify Environment Variables

Your `.env.local` should have:

```bash
# Authentication
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000

# Database
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
CONVEX_DEPLOYMENT=dev:...

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...

# Vector Search
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=workouts

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Step 4: Test the Pipeline

### 4.1 Start Servers

Make sure both servers are running:

```bash
# Terminal 1
npx convex dev

# Terminal 2
npm run dev
```

### 4.2 Navigate to App

1. Go to http://localhost:3000/login
2. Click "Continue as Dev User"
3. Go to /dashboard
4. You should see 5 unresolved workouts

### 4.3 Test Voice Recording

1. Click on a workout
2. Click "Start Recording"
3. Grant microphone permissions
4. Speak for 10-30 seconds about the workout:
   - "Did a 5 mile tempo run this morning"
   - "Felt really strong for the first 3 miles"
   - "Struggled a bit on the hills around mile 4"
   - "Left knee was a bit tight after"
   - "Overall RPE was about 7 out of 10"
5. Click "Stop Recording"
6. Review the transcript (should appear in textarea)
7. Click "Save Context & Mark Resolved"

### 4.4 Watch the Pipeline

You should see processing steps:
1. ✅ "Transcribing audio..." (~2-3 seconds)
2. ✅ "Extracting workout context with AI..." (~3-4 seconds)
3. ✅ "Generating semantic embeddings..." (~1 second)
4. ✅ "Saving to database..." (~1 second)
5. ✅ "Context Saved Successfully"

### 4.5 Verify Data

The workout should:
- Disappear from "Needs Context" panel
- Status changed to "resolved"
- Have structured data in Convex
- Have embedding vector in Pinecone

---

## Step 5: Test Vector Search (Optional)

Create a test search:

```bash
curl -X POST http://localhost:3000/api/workouts/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "workouts where I felt strong and had good energy",
    "userId": "YOUR_DEV_USER_ID",
    "topK": 5
  }'
```

Should return similar workouts based on semantic meaning!

---

## Architecture Overview

```
┌─────────────┐
│ USER SPEAKS │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ MediaRecorder API    │
│ Captures audio webm  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────┐
│ POST /api/openai/        │
│      transcribe          │
│ OpenAI Whisper API       │
│ Returns: text transcript │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ POST /api/workouts/      │
│      extract-context     │
│ Claude 3.5 Sonnet        │
│ Returns: structured JSON │
│ {                        │
│   workoutType: "run",    │
│   mood: "strong",        │
│   themes: [...],         │
│   painPoints: [...]      │
│ }                        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ POST /api/openai/embed   │
│ text-embedding-3-small   │
│ Returns: [1536 floats]   │
└──────┬───────────────────┘
       │
       ├───────────────┬──────────────┐
       │               │              │
       ▼               ▼              ▼
┌────────────┐  ┌──────────┐  ┌──────────┐
│  Pinecone  │  │  Convex  │  │  Convex  │
│  (Vector)  │  │ Context  │  │ Update   │
│            │  │  Table   │  │  Status  │
│  Semantic  │  │          │  │          │
│  Search    │  │ Struct'd │  │ resolved │
└────────────┘  └──────────┘  └──────────┘
```

---

## Troubleshooting

### Microphone Not Working

- **Chrome/Edge**: Requires HTTPS or localhost
- **Safari**: Check System Preferences → Privacy → Microphone
- **Firefox**: Check about:permissions

### Whisper API Errors

- Check OPENAI_API_KEY is correct
- Verify you have API credits
- Audio must be < 25MB

### Pinecone Errors

- Verify index name matches `PINECONE_INDEX`
- Check dimensions are `1536`
- Ensure API key is correct

### Claude Extraction Errors

- Verify ANTHROPIC_API_KEY
- Check API usage limits
- Review error logs in browser console

### Data Not Saving

- Check Convex is running (`npx convex dev`)
- Verify userId is correct
- Check browser console for errors

---

## Next Steps

1. ✅ Test full voice → AI → vector pipeline
2. 🔄 Build insights generation (queries Pinecone for patterns)
3. 🔄 Add semantic search UI
4. 🔄 Create visualization dashboard
5. 🔄 Add wearable device sync

---

## Cost Monitoring

Monitor your usage:

- **OpenAI**: https://platform.openai.com/usage
- **Anthropic**: https://console.anthropic.com/settings/usage
- **Pinecone**: https://app.pinecone.io/ (Dashboard)

Expected monthly costs (100 workouts):
- OpenAI: ~$1.50
- Anthropic: ~$1.50
- Pinecone: $0 (free tier)
- **Total**: ~$3/month

---

## Success Criteria

✅ Voice recording works in browser
✅ Whisper transcribes accurately
✅ Claude extracts structured data
✅ Embeddings generated successfully
✅ Data saved to Convex
✅ Vectors stored in Pinecone
✅ Workout marked as resolved

**You've built a production-ready AI pipeline!** 🎉
