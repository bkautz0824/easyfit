import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/openai/client";
import { searchSimilarWorkouts } from "@/lib/pinecone/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, userId, topK = 10, filter } = body as {
      query: string;
      userId: string;
      topK?: number;
      filter?: Record<string, any>;
    };

    if (!query || !userId) {
      return NextResponse.json(
        { error: "Query and userId are required" },
        { status: 400 }
      );
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar workouts in Pinecone
    const results = await searchSimilarWorkouts({
      embedding: queryEmbedding,
      userId,
      topK,
      filter,
    });

    return NextResponse.json({
      results,
      query,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching workouts:", error);
    return NextResponse.json(
      {
        error: "Failed to search workouts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
