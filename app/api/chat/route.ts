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

function sanitizeMessages(messages: any[]) {
  if (!Array.isArray(messages)) return messages;
  return messages.map((msg) => {
    if (!msg || typeof msg !== "object") return msg;
    if (Array.isArray(msg.parts)) {
      // 1. Filter out errored tool parts because they lack a valid `input` to pass strict Zod validation
      msg.parts = msg.parts.filter((part: any) => {
        if (part && typeof part === "object" && typeof part.type === "string" && part.type.startsWith("tool-")) {
          if (part.state === "output-error") return false;
        }
        return true;
      });

      // 2. Scrub remaining parts to match strict `ToolUIPart` schema
      msg.parts = msg.parts.map((part: any) => {
        if (part && typeof part === "object" && typeof part.type === "string" && part.type.startsWith("tool-")) {
          const cleanPart = { ...part };
          delete cleanPart.approval;
          if (!cleanPart.toolName) {
            cleanPart.toolName = cleanPart.type.replace("tool-", "");
          }
          return cleanPart;
        }
        return part;
      });
    }
    return msg;
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
