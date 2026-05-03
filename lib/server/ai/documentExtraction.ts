import "server-only";

import { generateText } from "ai";
import {
  ExtractDocumentRequest,
  normalizeExtractedBillContext,
} from "@/lib/shared/chat/documentContext";
import { getOpenRouterProvider, getPdfContextModelId } from "./openrouter";

const MEDICAL_BILL_EXTRACTION_PROMPT = [
  "Extract structured medical bill context and full document text from this PDF.",
  "Return valid JSON only. No markdown fences, no code fences, no explanation text.",
  "Extract all visible document information, not only bill summary fields.",
  "Preserve labels, headings, table rows, CPT/HCPCS codes, dates, addresses, phone numbers, payer/provider names, totals, adjustments, payments, patient responsibility, claim identifiers, and footnotes when visible.",
  "Use markdown tables for table-like document regions.",
  "Separate pages with page numbers.",
  "Use [illegible] for unreadable visible text and null for unknown structured scalar fields.",
  "Use this exact JSON shape:",
  "{",
  '  "summary": string,',
  '  "providerName": string | null,',
  '  "hospitalName": string | null,',
  '  "insuranceProvider": string | null,',
  '  "insurancePlan": string | null,',
  '  "dateOfService": string | null,',
  '  "billedAmount": number | null,',
  '  "allowedAmount": number | null,',
  '  "patientResponsibility": number | null,',
  '  "lineItems": [{ "cptCode": string | null, "description": string | null, "units": number | null, "billedAmount": number | null, "allowedAmount": number | null }],',
  '  "missingFields": string[],',
  '  "confidence": number,',
  '  "pageCount": number | null,',
  '  "pages": [{ "pageNumber": number, "text": string }],',
  '  "documentMarkdown": string,',
  '  "extractionNotes": string[]',
  "}",
  "Rules:",
  "- Return only facts visible in the document.",
  "- Use null for unknown scalar fields and [] for missing arrays.",
  "- Amounts should be numbers in dollars, not cents.",
  "- billedAmount is the total charge from the hospital/provider.",
  "- allowedAmount is billedAmount minus contractual adjustments, negotiation, or writeoff. Do not include insurance payments.",
  "- For line items, capture CPT/HCPCS codes, descriptions, units, billed amount, and allowed amount when visible.",
  "- For pages[].text and documentMarkdown, include the full extracted document in an LLM-friendly markdown format, not just the summary.",
  "- When document text is duplicated across pages, preserve it on the page where it appears.",
  "- State codes should be two letters when visible.",
  "- Set confidence from 0 to 1 based on legibility and field certainty.",
].join("\n");

export async function extractBillContextFromPdf(
  request: ExtractDocumentRequest,
) {
  const openrouter = getOpenRouterProvider();
  const base64Pdf = request.dataUrl.slice(
    `data:${request.mimeType};base64,`.length,
  );

  const result = await generateText({
    model: openrouter(getPdfContextModelId()),
    system: MEDICAL_BILL_EXTRACTION_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract the attached PDF according to the system instructions.",
          },
          {
            type: "file",
            data: base64Pdf,
            mediaType: request.mimeType,
            filename: request.fileName,
          },
        ],
      },
    ],
    maxOutputTokens: 12000,
  });

  return normalizeExtractedBillContext(parseJsonText(result.text), {
    fileName: request.fileName,
    mimeType: request.mimeType,
    sizeBytes: request.sizeBytes,
  });
}

function parseJsonText(text: string) {
  const direct = tryParseJson(text);
  if (direct) return direct;

  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    const extracted = tryParseJson(match[0]);
    if (extracted) return extracted;
  }

  throw new Error("Model did not return valid JSON output");
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
