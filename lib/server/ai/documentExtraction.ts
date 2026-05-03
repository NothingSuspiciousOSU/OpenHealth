import "server-only";

import { generateText } from "ai";
import {
  BillDocumentContext,
  ExtractDocumentRequest,
  parseExtractedBillContext,
} from "@/lib/shared/chat/documentContext";
import { getOpenRouterProvider, getPdfContextModelId } from "./openrouter";

const MEDICAL_BILL_EXTRACTION_PROMPT = [
  "Parse this medical billing document and return JSON only.",
  "Use this exact top-level shape:",
  "{",
  '  "procedures": [',
  "    {",
  '      "procedureDescription": string,',
  '      "dateOfProcedure": string,',
  '      "hospitalName": string,',
  '      "location": { "city": string, "state": string },',
  '      "insurance": { "providerName": string, "planName": string },',
  '      "billedAmount": number,',
  '      "allowedAmount": number',
  "    }",
  "  ],",
  '  "procedureLineItems": [',
  "    {",
  '      "cptCode": string,',
  '      "serviceName": string | null,',
  '      "units": number,',
  '      "providerName": string | null,',
  '      "costPerUnit": number',
  "    }",
  "  ]",
  "}",
  "Rules:",
  "- Return valid JSON only. No markdown, no code fences, no explanation text.",
  "- dateOfProcedure must be an ISO 8601 datetime format: YYYY-MM-DDThh:mm:ssZ.",
  "- billedAmount is the total charges from the hospital/provider.",
  "- allowedAmount is billedAmount minus any contractual adjustments, negotiation, or writeoff. Do NOT include payments by insurance.",
  "- costPerUnit should always be positive charges. Do not include any negative charges such as adjustments or payments to amount.",
  "- Monetary fields must be float: dollar.cents.",
  "- State code should be two letters.",
  "- If a value is missing, use an empty string, 0, or null for serviceName.",
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
  const proceduresValue = firstDefined(record.procedures, record.Procedures);
  const procedures = Array.isArray(proceduresValue) ? proceduresValue : [];
  const firstProcedure = isRecord(procedures[0]) ? procedures[0] : {};
  const insurance = isRecord(firstProcedure.insurance) ? firstProcedure.insurance : {};
  const procedureLocation = isRecord(firstProcedure.location) ? firstProcedure.location : {};
  const lineItemsValue = firstDefined(
    record.procedureLineItems,
    record.procedure_line_items,
    record.lineItems,
    record.line_items,
  );
  const lineItems = Array.isArray(lineItemsValue) ? lineItemsValue : [];
  const firstLineItem = isRecord(lineItems[0]) ? lineItems[0] : {};
  const providerName = stringValue(
    firstDefined(
      record.providerName,
      record.provider_name,
      record.provider,
      firstLineItem.providerName,
      firstLineItem.provider_name,
    ),
  );
  const hospitalName = stringValue(
    firstDefined(
      record.hospitalName,
      record.hospital_name,
      record.hospital,
      firstProcedure.hospitalName,
      firstProcedure.hospital_name,
    ),
  );
  const insuranceProvider = stringValue(
    firstDefined(
      record.insuranceProvider,
      record.insurance_provider,
      record.payer,
      insurance.providerName,
      insurance.provider_name,
    ),
  );
  const insurancePlan = stringValue(
    firstDefined(
      record.insurancePlan,
      record.insurance_plan,
      record.plan,
      insurance.planName,
      insurance.plan_name,
    ),
  );
  const dateOfService = stringValue(
    firstDefined(
      record.dateOfService,
      record.date_of_service,
      record.service_date,
      firstProcedure.dateOfProcedure,
      firstProcedure.date_of_procedure,
    ),
  );
  const billedAmount = numberValue(
    firstDefined(
      record.billedAmount,
      record.billed_amount,
      firstProcedure.billedAmount,
      firstProcedure.billed_amount,
    ),
  );
  const allowedAmount = numberValue(
    firstDefined(
      record.allowedAmount,
      record.allowed_amount,
      firstProcedure.allowedAmount,
      firstProcedure.allowed_amount,
    ),
  );

  return {
    summary: stringValue(record.summary) ?? buildSummary({
      procedureDescription: stringValue(
        firstDefined(firstProcedure.procedureDescription, firstProcedure.procedure_description),
      ),
      hospitalName,
      city: stringValue(firstDefined(procedureLocation.city, record.city)),
      state: stringValue(firstDefined(procedureLocation.state, record.state)),
    }),
    providerName,
    hospitalName,
    insuranceProvider,
    insurancePlan,
    dateOfService,
    billedAmount,
    allowedAmount,
    patientResponsibility: numberValue(
      firstDefined(
        record.patientResponsibility,
        record.patient_responsibility,
        record.patient_amount,
      ),
    ),
    lineItems: lineItems.map((item) => {
      const line = isRecord(item) ? item : {};
      const units = numberValue(line.units);
      const costPerUnit = numberValue(firstDefined(line.costPerUnit, line.cost_per_unit));
      return {
        cptCode: stringValue(firstDefined(line.cptCode, line.cpt_code, line.code)),
        description: stringValue(firstDefined(line.description, line.serviceName, line.service_name)),
        units,
        billedAmount: numberValue(firstDefined(line.billedAmount, line.billed_amount))
          ?? totalLineCharge(units, costPerUnit),
        allowedAmount: numberValue(firstDefined(line.allowedAmount, line.allowed_amount)),
      };
    }),
    missingFields: Array.isArray(record.missingFields)
      ? record.missingFields.filter((field): field is string => typeof field === "string")
      : [],
    confidence: clampConfidence(numberValue(record.confidence) ?? 0.5),
  };
}

function buildSummary({
  procedureDescription,
  hospitalName,
  city,
  state,
}: {
  procedureDescription: string | null;
  hospitalName: string | null;
  city: string | null;
  state: string | null;
}) {
  const location = [city, state].filter(Boolean).join(", ");
  const details = [procedureDescription, hospitalName, location].filter(Boolean);
  return details.length > 0
    ? `Extracted medical bill context: ${details.join(" at ")}.`
    : "Extracted medical bill context.";
}

function totalLineCharge(units: number | null, costPerUnit: number | null) {
  if (units === null || costPerUnit === null) return null;
  return Math.round(units * costPerUnit * 100) / 100;
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
