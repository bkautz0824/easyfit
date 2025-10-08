import { NextRequest, NextResponse } from "next/server";
import { callClaude, ClaudeMessage } from "@/lib/agents/claude";

export async function POST(req: NextRequest) {
  try {
    // Authentication is handled by middleware

    const body = await req.json() as {
      messages: ClaudeMessage[];
      system?: string;
      model?: string;
      max_tokens?: number;
      temperature?: number;
    };

    const { messages, system, model, max_tokens, temperature } = body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const result = await callClaude({
      messages,
      system,
      model,
      max_tokens,
      temperature,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in Claude API route:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
