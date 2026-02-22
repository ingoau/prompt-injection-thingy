import { openrouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { NextResponse } from "next/server";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY environment variable." },
      { status: 500 },
    );
  }

  try {
    const { messages } = (await request.json()) as { messages?: UIMessage[] };

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected a messages array." },
        { status: 400 },
      );
    }

    const modelMessages = await convertToModelMessages(
      messages.map((message) => {
        const messageWithoutId = {
          ...message,
        } as Omit<UIMessage, "id"> & { id?: string };

        delete messageWithoutId.id;
        return messageWithoutId;
      }),
    );

    const result = streamText({
      model: openrouter(process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL),
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json(
      { error: `Chat request failed: ${message}` },
      { status: 500 },
    );
  }
}
