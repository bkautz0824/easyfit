import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, generateEmbeddings } from "@/lib/openai/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, texts } = body as { text?: string; texts?: string[] };

    if (!text && !texts) {
      return NextResponse.json(
        { error: "Either 'text' or 'texts' array is required" },
        { status: 400 }
      );
    }

    // Handle single embedding
    if (text) {
      const embedding = await generateEmbedding(text);
      return NextResponse.json({
        embedding,
        dimensions: embedding.length,
        success: true,
      });
    }

    // Handle batch embeddings
    if (texts) {
      const embeddings = await generateEmbeddings(texts);
      return NextResponse.json({
        embeddings,
        count: embeddings.length,
        dimensions: embeddings[0]?.length || 0,
        success: true,
      });
    }
  } catch (error) {
    console.error("Error in embedding route:", error);
    return NextResponse.json(
      {
        error: "Failed to generate embedding",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
