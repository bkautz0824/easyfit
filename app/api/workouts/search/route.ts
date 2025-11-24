import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateEmbedding } from "@/lib/openai/client";

// Initialize Convex client for server-side calls
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query,
      userId,
      limit = 10,
      // Pre-filters (fast, applied during vector search)
      workoutType,
      mood,
      // Post-filters (flexible, applied after vector search)
      bodyPart,
      hasPainPoints,
      minPerceivedExertion,
      // Search mode
      mode = "semantic", // "semantic" | "exact_bodypart"
    } = body as {
      query: string;
      userId: string;
      limit?: number;
      workoutType?: string;
      mood?: string;
      bodyPart?: string;
      hasPainPoints?: boolean;
      minPerceivedExertion?: number;
      mode?: "semantic" | "exact_bodypart";
    };

    if (!query || !userId) {
      return NextResponse.json(
        { error: "Query and userId are required" },
        { status: 400 }
      );
    }

    // MODE 1: Exact body part search (no embedding needed)
    if (mode === "exact_bodypart" && bodyPart) {
      const results = await convex.query(api.workoutContext.searchByBodyPart, {
        userId,
        bodyPart,
        workoutType,
        sortBy: hasPainPoints ? "pain_severity" : "date",
      });

      return NextResponse.json({
        results,
        query,
        count: results.length,
        mode: "exact_bodypart",
        message: `Found ${results.length} workouts mentioning ${bodyPart}`,
      });
    }

    // MODE 2: Semantic search with optional filters
    // Generate embedding for the search query using OpenAI
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar workouts using Convex vector search
    const results = await convex.query(api.workoutContext.vectorSearch, {
      embedding: queryEmbedding,
      userId,
      limit,
      // Pre-filters
      workoutType,
      mood,
      // Post-filters
      bodyPart,
      hasPainPoints,
      minPerceivedExertion,
    });

    return NextResponse.json({
      results,
      query,
      count: results.length,
      mode: "semantic",
      filters: {
        pre: { workoutType, mood },
        post: { bodyPart, hasPainPoints, minPerceivedExertion },
      },
      message: "Semantic search using Convex vector index with filters",
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
