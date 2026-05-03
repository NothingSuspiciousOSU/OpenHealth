import { createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { createOpenHealthChatAgent } from "@/lib/server/ai/chatAgent";
import { billDocumentContextSchema } from "@/lib/shared/chat/documentContext";

export const runtime = "nodejs";
export const maxDuration = 300;

const chatRequestSchema = z.object({
  messages: z.array(z.unknown()),
  documentContext: billDocumentContextSchema.optional(),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ToolPartRecord = Record<string, unknown> & { type: string };

function isToolPart(part: unknown): part is ToolPartRecord {
  return (
    isRecord(part) &&
    typeof part.type === "string" &&
    part.type.startsWith("tool-")
  );
}

function sanitizeMessages(messages: unknown[]) {
  return messages.map((message) => {
    if (!isRecord(message) || !Array.isArray(message.parts)) {
      return message;
    }

    const parts = message.parts
      .filter((part) => !isToolPart(part) || part.state !== "output-error")
      .map((part) => {
        if (!isToolPart(part)) return part;

        const cleanPart: ToolPartRecord = { ...part };
        delete cleanPart.approval;

        if (typeof cleanPart.toolName !== "string") {
          cleanPart.toolName = cleanPart.type.replace(/^tool-/, "");
        }

        return cleanPart;
      });

    return { ...message, parts };
  });
}

export async function POST(request: Request) {
  try {
    const body = chatRequestSchema.parse(await request.json());
    const agent = createOpenHealthChatAgent(body.documentContext);

    return createAgentUIStreamResponse({
      agent,
      uiMessages: sanitizeMessages(body.messages),
      abortSignal: request.signal,
      timeout: { totalMs: 300_000 },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The chat agent could not start.";
    return new Response(message, { status: 400 });
  }
}
