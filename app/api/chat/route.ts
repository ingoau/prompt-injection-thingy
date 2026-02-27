import { openrouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText, tool, UIMessage } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getLevelByIndex } from "@/lib/levels";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY environment variable." },
      { status: 500 },
    );
  }

  try {
    const requestUrl = new URL(request.url);
    const levelIndexFromQuery = Number.parseInt(
      requestUrl.searchParams.get("levelIndex") ?? "",
      10,
    );
    const {
      messages,
      levelIndex: levelIndexFromBody,
    } = (await request.json()) as {
      messages?: UIMessage[];
      levelIndex?: number;
    };

    const hasBodyLevelIndex =
      typeof levelIndexFromBody === "number" && Number.isInteger(levelIndexFromBody);
    const hasQueryLevelIndex = Number.isInteger(levelIndexFromQuery);
    const levelIndex = hasBodyLevelIndex
      ? levelIndexFromBody
      : hasQueryLevelIndex
        ? levelIndexFromQuery
        : 0;
    const level = getLevelByIndex(levelIndex);

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
      model: openrouter(level.model || process.env.OPENROUTER_MODEL || DEFAULT_MODEL),
      system: level.systemPrompt,
      messages: modelMessages,
      tools: {
        continue: tool({
          description: "Continue to the next step.",
          inputSchema: z.object({}),
          execute: async () => ({
            continued: true,
          }),
        }),
      },
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
