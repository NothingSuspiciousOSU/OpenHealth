import { createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { createOpenHealthChatAgent } from "@/lib/server/ai/chatAgent";
import { billDocumentContextSchema } from "@/lib/shared/chat/documentContext";

export const runtime = "nodejs";
export const maxDuration = 120;

const chatRequestSchema = z.object({
  messages: z.array(z.unknown()),
  documentContext: billDocumentContextSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const body = chatRequestSchema.parse(await request.json());
    const agent = createOpenHealthChatAgent(body.documentContext);

    return createAgentUIStreamResponse({
      agent,
      uiMessages: body.messages,
      abortSignal: request.signal,
      timeout: { totalMs: 120_000 },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The chat agent could not start.";
    return new Response(message, { status: 400 });
  }
}
