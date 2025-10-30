import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Get the workouts index
export const workoutsIndex = pinecone.index(
  process.env.PINECONE_INDEX || "workouts"
);

// Helper to upsert workout context embedding
export async function upsertWorkoutEmbedding({
  workoutId,
  userId,
  embedding,
  metadata,
}: {
  workoutId: string;
  userId: string;
  embedding: number[];
  metadata: {
    date: string;
    workoutType?: string;
    workoutSubType?: string;
    mood?: string;
    perceivedExertion?: number;
    themes?: string[];
    feelings?: string[];
    keywords?: string[];
    painPoints?: string[];
  };
}) {
  await workoutsIndex.upsert([
    {
      id: workoutId,
      values: embedding,
      metadata: {
        userId,
        date: metadata.date,
        workoutType: metadata.workoutType || "",
        workoutSubType: metadata.workoutSubType || "",
        mood: metadata.mood || "",
        perceivedExertion: metadata.perceivedExertion || 0,
        // Store arrays as JSON strings
        themes: JSON.stringify(metadata.themes || []),
        feelings: JSON.stringify(metadata.feelings || []),
        keywords: JSON.stringify(metadata.keywords || []),
        painPoints: JSON.stringify(metadata.painPoints || []),
      },
    },
  ]);
}

// Helper for semantic search
export async function searchSimilarWorkouts({
  embedding,
  userId,
  topK = 10,
  filter,
}: {
  embedding: number[];
  userId: string;
  topK?: number;
  filter?: Record<string, any>;
}) {
  const results = await workoutsIndex.query({
    vector: embedding,
    topK,
    filter: {
      userId,
      ...filter,
    },
    includeMetadata: true,
  });

  return results.matches.map((match) => ({
    workoutId: match.id,
    score: match.score,
    metadata: {
      ...match.metadata,
      // Parse JSON arrays back
      themes: match.metadata?.themes
        ? JSON.parse(match.metadata.themes as string)
        : [],
      feelings: match.metadata?.feelings
        ? JSON.parse(match.metadata.feelings as string)
        : [],
      keywords: match.metadata?.keywords
        ? JSON.parse(match.metadata.keywords as string)
        : [],
      painPoints: match.metadata?.painPoints
        ? JSON.parse(match.metadata.painPoints as string)
        : [],
    },
  }));
}

// Helper to generate query embedding from natural language
export async function searchByNaturalLanguage({
  query,
  userId,
  topK = 10,
}: {
  query: string;
  userId: string;
  topK?: number;
}) {
  // This will be called from an API route that has access to OpenAI
  // For now, just export the function signature
  throw new Error(
    "Call this from an API route with OpenAI client to generate embedding"
  );
}

export default pinecone;
