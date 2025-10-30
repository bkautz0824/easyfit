import Anthropic from "@anthropic-ai/sdk";

// Initialize the client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeResponse {
  content: string;
  id: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Helper function for Claude API calls
export async function callClaude({
  model = "claude-sonnet-4-5", // Latest Claude Sonnet (auto-updates to newest 4.5)
  messages,
  system,
  max_tokens = 1000,
  temperature = 0.7,
}: {
  model?: string;
  messages: ClaudeMessage[];
  system?: string;
  max_tokens?: number;
  temperature?: number;
}): Promise<ClaudeResponse> {
  try {
    const response = await anthropic.messages.create({
      model,
      messages,
      system,
      max_tokens,
      temperature,
    });

    const textContent = response.content.find(
      (block) => block.type === "text"
    );

    return {
      content: textContent && "text" in textContent ? textContent.text : "",
      id: response.id,
      model: response.model,
      usage: response.usage,
    };
  } catch (error) {
    console.error("Error calling Claude:", error);
    throw new Error(
      `Failed to process request with Claude: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Streaming version for real-time responses
export async function* streamClaude({
  model = "claude-sonnet-4-5", // Latest Claude Sonnet (auto-updates to newest 4.5)
  messages,
  system,
  max_tokens = 1000,
  temperature = 0.7,
}: {
  model?: string;
  messages: ClaudeMessage[];
  system?: string;
  max_tokens?: number;
  temperature?: number;
}): AsyncGenerator<string> {
  try {
    const stream = await anthropic.messages.create({
      model,
      messages,
      system,
      max_tokens,
      temperature,
      stream: true,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  } catch (error) {
    console.error("Error streaming from Claude:", error);
    throw new Error(
      `Failed to stream from Claude: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
