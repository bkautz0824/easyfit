# Search Strategies: Semantic vs Exact Filtering

## The Core Question: When to use what?

You have **two powerful tools** for finding workout data:
1. **Semantic Search** (embedding-based) - Finds similar meanings
2. **Exact Filtering** (structured data) - Finds exact matches

## Understanding Each Approach

### 🎯 Semantic Search (Vector Embeddings)

**What it does:**
Converts text to a 1536-dimensional vector and finds mathematically similar vectors.

**Example:**
```typescript
Query: "workouts where my knee hurt"
Embedding: [0.234, -0.567, 0.891, ...]

Finds workouts with similar semantic meaning:
✅ "left knee was tight during run"
✅ "right knee discomfort after mile 3"
✅ "knee swelling post-workout"
✅ "patella felt sore on downhills"
✅ "kneecap pain when going upstairs"
✅ "leg pain, mostly around the knee joint"
```

**Strengths:**
- ✅ Understands synonyms ("knee" = "patella" = "kneecap")
- ✅ Understands context ("knee hurt" vs "knee felt strong")
- ✅ Natural language queries work great
- ✅ Finds related content even with different wording
- ✅ Great for exploration and discovery

**Weaknesses:**
- ❌ Less precise - might return general "leg pain" too
- ❌ Can miss exact matches if semantically different
- ❌ Similarity is fuzzy (no guarantees)
- ❌ Requires OpenAI API call to generate query embedding ($$$)

**Cost:** ~$0.0001 per query (cheap but not free)

---

### 📊 Exact Filtering (Structured Data)

**What it does:**
Filters based on Claude-extracted structured fields in the database.

**Example:**
```typescript
Filter: { bodyPart: "knee" }

Exact substring match in bodyParts array:
✅ "left knee"
✅ "right knee"
✅ "knee"
❌ "patella" (not extracted to bodyParts)
❌ "kneecap" (not extracted to bodyParts)
❌ "knee area" (depends on Claude extraction)
```

**Strengths:**
- ✅ Precise, deterministic results
- ✅ Fast (no embedding computation)
- ✅ No API costs
- ✅ Perfect for faceted search (checkboxes, dropdowns)
- ✅ Can sort by specific fields (pain severity, date, RPE)

**Weaknesses:**
- ❌ Only as good as Claude's extraction
- ❌ Misses synonyms and variations
- ❌ Brittle to terminology differences
- ❌ Requires knowing exact field values

**Cost:** Free (just database query)

---

## When to Use Each Strategy

### ✅ Use **Semantic Search** when:

1. **User is exploring conversationally**
   ```
   "Show me my hardest workouts"
   "When did my knee start hurting?"
   "Workouts where I felt exhausted"
   ```

2. **You want fuzzy matching**
   - Finds variations and synonyms automatically
   - Good for natural language interfaces

3. **You're building a search bar**
   - Users type free-form queries
   - You want Google-like search experience

4. **You want to find similar experiences**
   ```
   "Find workouts similar to today's run"
   "Show me other times I felt like this"
   ```

---

### ✅ Use **Exact Filtering** when:

1. **You need precise, deterministic results**
   ```
   "Show ALL workouts where knee was mentioned"
   "Find every run with pain points"
   ```

2. **Building UI filters/facets**
   - Dropdown: "Filter by body part"
   - Checkbox: "Only show workouts with pain"
   - Slider: "Minimum RPE of 7"

3. **Cost is a concern**
   - No API calls needed
   - Instant results

4. **You want to track trends over time**
   ```
   "Count of knee mentions by month"
   "Average RPE when shoulder is mentioned"
   ```

---

## The Sweet Spot: Hybrid Search

**Combine both approaches for the best results!**

### Strategy 1: Semantic Search + Post-Filter

**Use case:** "Find hard workouts where my knee hurt"

```typescript
POST /api/workouts/search
{
  "query": "hard workouts where I struggled",  // Semantic
  "userId": "user_123",
  "bodyPart": "knee",                          // Exact filter
  "minPerceivedExertion": 7                    // Exact filter
}
```

**How it works:**
1. Generate embedding from "hard workouts where I struggled"
2. Find 20 semantically similar workouts
3. Post-filter to only keep ones with:
   - "knee" in bodyParts array
   - RPE >= 7

**Result:** Best of both worlds!
- Semantic understanding of "hard" and "struggled"
- Precise filtering on knee + RPE

---

### Strategy 2: Pre-Filter + Semantic Search

**Use case:** "Find my worst runs" (only search within runs)

```typescript
POST /api/workouts/search
{
  "query": "worst performance, felt terrible",
  "userId": "user_123",
  "workoutType": "run"  // Pre-filter (before vector search)
}
```

**How it works:**
1. Pre-filter: Only consider workouts where workoutType = "run"
2. Within that subset, do semantic search for "worst performance"
3. Rank by similarity

**Benefit:** Faster + more relevant (only searches relevant category)

---

## Practical Examples

### Example 1: Injury Tracking Dashboard

**Goal:** Track knee issues over time

**Approach: Exact Filtering**
```typescript
// Get all knee mentions sorted by pain severity
const results = await convex.query(api.workoutContext.searchByBodyPart, {
  userId: "user_123",
  bodyPart: "knee",
  sortBy: "pain_severity"  // Sorts by painPoints.length
});

// Result: Chronological list showing progression
// Perfect for injury tracking timeline
```

**Why not semantic?** You want EVERY mention, not just similar ones. Semantic might miss some or include unrelated results.

---

### Example 2: "Show me workouts like this one"

**Goal:** Find similar workout experiences

**Approach: Pure Semantic Search**
```typescript
// User clicks "Find similar" on a workout
const transcript = workout.context.voiceTranscript;
const embedding = await generateEmbedding(transcript);

const similar = await convex.query(api.workoutContext.vectorSearch, {
  embedding,
  userId: "user_123",
  limit: 10
});

// Result: 10 most semantically similar workouts
```

**Why not exact?** You want contextual similarity, not exact field matches. Semantic captures the "vibe" of the workout.

---

### Example 3: Advanced Injury Prevention

**Goal:** "Show me runs where I mentioned knee pain, sorted by how hard I pushed"

**Approach: Hybrid (Post-filter + Sort)**
```typescript
POST /api/workouts/search
{
  "query": "knee pain during run",
  "userId": "user_123",
  "workoutType": "run",        // Pre-filter: only runs
  "bodyPart": "knee",           // Post-filter: knee mentioned
  "hasPainPoints": true,        // Post-filter: pain was noted
  "minPerceivedExertion": 6     // Post-filter: moderate+ effort
}
```

**Result:** Runs where:
- Semantic similarity to "knee pain" (catches variations)
- Definitely mentioned knee (exact filter)
- Had pain points (not just mention)
- RPE was 6+ (pushed hard)

**Analysis opportunity:** Is high RPE causing knee pain?

---

### Example 4: Voice Assistant Query

**User says:** "Hey, show me times when my shoulder hurt during swimming"

**Approach: Hybrid Semantic**
```typescript
POST /api/workouts/search
{
  "query": "shoulder hurt during swimming",
  "userId": "user_123",
  "workoutType": "swim",     // Pre-filter (fast)
  "bodyPart": "shoulder"     // Post-filter (precise)
}
```

**Why this combo?**
- Pre-filter by swim: Fast, reduces search space
- Semantic "shoulder hurt": Catches "shoulder pain", "shoulder ache", "shoulder discomfort"
- Post-filter shoulder: Ensures Claude extracted it (not just embedding similarity)

---

## Performance Comparison

### Semantic Search
```
Query: "knee hurt workouts"
Steps:
1. Generate embedding: ~1 second, $0.0001
2. Vector search: ~50ms
3. Fetch workouts: ~50ms
Total: ~1.1 seconds

Returns: 10 most similar workouts (fuzzy, ranked by similarity)
```

### Exact Filtering
```
Query: bodyPart = "knee"
Steps:
1. Database query with filter: ~30ms
2. Fetch workouts: ~30ms
Total: ~60ms

Returns: ALL workouts with "knee" in bodyParts (exact, unranked)
```

### Hybrid (Best of both)
```
Query: "knee hurt" + bodyPart filter
Steps:
1. Generate embedding: ~1 second
2. Vector search: ~50ms
3. Post-filter in memory: ~10ms
4. Fetch workouts: ~50ms
Total: ~1.1 seconds

Returns: 10 semantically similar + guaranteed to have "knee" (fuzzy + precise)
```

---

## API Usage Examples

### Semantic Search (Natural Language)
```bash
curl -X POST http://localhost:3000/api/workouts/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "workouts where my knee hurt",
    "userId": "user_123",
    "limit": 10
  }'
```

### Exact Body Part Search
```bash
curl -X POST http://localhost:3000/api/workouts/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "knee",
    "userId": "user_123",
    "mode": "exact_bodypart",
    "bodyPart": "knee",
    "workoutType": "run"
  }'
```

### Hybrid Search (Semantic + Filters)
```bash
curl -X POST http://localhost:3000/api/workouts/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "really struggled and felt terrible",
    "userId": "user_123",
    "bodyPart": "knee",
    "hasPainPoints": true,
    "minPerceivedExertion": 7,
    "workoutType": "run"
  }'
```

---

## Filter Fields Reference

### Pre-Filters (Applied during vector search - FAST)
These are indexed in the vector index, so filtering is instantaneous:
- `workoutType` (string) - "run", "bike", "swim", "strength"
- `mood` (string) - "great", "good", "tired", "stressed"

### Post-Filters (Applied after vector search - FLEXIBLE)
These are applied in-memory after getting vector results:
- `bodyPart` (string) - Checks if string is in `bodyParts` array
- `hasPainPoints` (boolean) - Only workouts with pain mentioned
- `minPerceivedExertion` (number) - Minimum RPE threshold (1-10)

**Why the split?**
- **Pre-filters** reduce the search space (faster vector search)
- **Post-filters** allow complex filtering on arrays/computed values

---

## Recommendations

### For Your Use Case: Knee Injury Tracking

**Best approach: Use BOTH strategically**

1. **Dashboard View (Injury Timeline):**
   - Use `searchByBodyPart` with exact filtering
   - Shows ALL knee mentions chronologically
   - Sort by pain severity or date
   - **Why:** You want complete historical data, not fuzzy matches

2. **"Find Similar" Button:**
   - Use semantic search
   - "Show me other workouts like this one"
   - **Why:** Discover related patterns you might not have thought of

3. **Voice Query Interface:**
   - Use hybrid semantic + post-filter
   - User says: "Show me runs where my knee hurt"
   - **Why:** Natural language + precision

### Implementation Pattern

```typescript
// Component: KneeInjuryTracker.tsx
function KneeInjuryTracker({ userId }) {

  // Timeline view (exact)
  const kneeWorkouts = useQuery(api.workoutContext.searchByBodyPart, {
    userId,
    bodyPart: "knee",
    sortBy: "date"
  });

  // When user clicks "Find similar" (semantic)
  async function findSimilar(workout) {
    const embedding = await generateEmbedding(workout.voiceTranscript);
    return await convex.query(api.workoutContext.vectorSearch, {
      embedding,
      userId,
      bodyPart: "knee",  // Still want knee-related
      limit: 5
    });
  }

  return (
    <div>
      <Timeline workouts={kneeWorkouts} />
      <SearchBar onSearch={findSimilar} />
    </div>
  );
}
```

---

## Summary Decision Matrix

| Use Case | Approach | Why |
|----------|----------|-----|
| "Show ALL knee workouts" | Exact filter | Need complete data |
| "Find my hardest runs" | Semantic | Natural language understanding |
| "Runs where knee hurt" | Hybrid | Precision + meaning |
| UI dropdown filters | Exact filter | Fast, deterministic |
| Voice assistant query | Hybrid | Natural input + precise results |
| "Find similar to this" | Semantic | Contextual similarity |
| Injury tracking dashboard | Exact filter | Historical completeness |
| Trend analysis | Exact filter | Consistent field matching |

---

## Key Takeaway

**Use semantic search for discovery and exploration. Use exact filtering for precision and tracking. Use both together for the best experience.**

Your knee pain tracking use case benefits most from:
1. **Exact filtering** for the main dashboard (show ALL knee mentions)
2. **Semantic search** for "find similar patterns" exploration
3. **Hybrid** for voice queries and advanced searches
