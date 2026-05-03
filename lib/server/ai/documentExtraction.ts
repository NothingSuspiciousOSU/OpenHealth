import "server-only";

import { generateText } from "ai";
import {
  BillDocumentContext,
  ExtractDocumentRequest,
  parseExtractedBillContext,
} from "@/lib/shared/chat/documentContext";
import { getOpenRouterProvider, getPdfContextModelId } from "./openrouter";

export async function extractBillContextFromPdf(
  request: ExtractDocumentRequest,
) {
  const openrouter = getOpenRouterProvider();
  const base64Pdf = request.dataUrl.slice(
    `data:${request.mimeType};base64,`.length,
  );

  const result = await generateText({
    model: openrouter(getPdfContextModelId()),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "Extract structured medical bill context from this PDF.",
              "Return valid JSON only. Do not use markdown or code fences.",
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
              '  "confidence": number',
              "}",
              "Return only facts visible in the document.",
              "Use null for unknown scalar fields and [] for missing line items.",
              "Amounts should be numbers in dollars, not cents.",
              "For line items, capture CPT/HCPCS codes, descriptions, units, billed amount, and allowed amount when visible.",
              "Set confidence from 0 to 1 based on legibility and field certainty.",
            ].join("\n"),
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
    maxOutputTokens: 3000,
  });

  return parseExtractedBillContext(normalizeBillContext(parseJsonText(result.text)));
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

function normalizeBillContext(value: unknown): BillDocumentContext {
  const record = isRecord(value) ? value : {};
  const lineItemsValue = firstDefined(record.lineItems, record.line_items);
  const lineItems = Array.isArray(lineItemsValue) ? lineItemsValue : [];

  return {
    summary: stringValue(record.summary) ?? "Extracted medical bill context.",
    providerName: stringValue(firstDefined(record.providerName, record.provider_name, record.provider)),
    hospitalName: stringValue(firstDefined(record.hospitalName, record.hospital_name, record.hospital)),
    insuranceProvider: stringValue(
      firstDefined(record.insuranceProvider, record.insurance_provider, record.payer),
    ),
    insurancePlan: stringValue(firstDefined(record.insurancePlan, record.insurance_plan, record.plan)),
    dateOfService: stringValue(firstDefined(record.dateOfService, record.date_of_service, record.service_date)),
    billedAmount: numberValue(firstDefined(record.billedAmount, record.billed_amount)),
    allowedAmount: numberValue(firstDefined(record.allowedAmount, record.allowed_amount)),
    patientResponsibility: numberValue(
      firstDefined(
        record.patientResponsibility,
        record.patient_responsibility,
        record.patient_amount,
      ),
    ),
    lineItems: lineItems.map((item) => {
      const line = isRecord(item) ? item : {};
      return {
        cptCode: stringValue(firstDefined(line.cptCode, line.cpt_code, line.code)),
        description: stringValue(firstDefined(line.description, line.serviceName, line.service_name)),
        units: numberValue(line.units),
        billedAmount: numberValue(firstDefined(line.billedAmount, line.billed_amount)),
        allowedAmount: numberValue(firstDefined(line.allowedAmount, line.allowed_amount)),
      };
    }),
    missingFields: Array.isArray(record.missingFields)
      ? record.missingFields.filter((field): field is string => typeof field === "string")
      : [],
    confidence: clampConfidence(numberValue(record.confidence) ?? 0.5),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => value !== undefined);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clampConfidence(value: number) {
  return Math.min(Math.max(value, 0), 1);
}
