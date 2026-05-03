import { NextResponse } from "next/server";
import { extractBillContextFromPdf } from "@/lib/server/ai/documentExtraction";
import { extractDocumentRequestSchema } from "@/lib/shared/chat/documentContext";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = extractDocumentRequestSchema.parse(await request.json());
    const context = await extractBillContextFromPdf(body);

    return NextResponse.json(context);
  } catch (error) {
    console.error("PDF extraction failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Could not extract bill context from that PDF.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
