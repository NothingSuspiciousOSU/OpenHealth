import { z } from "zod";

export const MAX_CHAT_PDF_BYTES = 3 * 1024 * 1024;
export const CHAT_PDF_MIME_TYPE = "application/pdf";

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

export const billDocumentSourceSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.literal(CHAT_PDF_MIME_TYPE),
  sizeBytes: z.number().int().positive().max(MAX_CHAT_PDF_BYTES),
});

export const billDocumentPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  text: z.string(),
});

export const billLineItemSchema = z.object({
  cptCode: nullableString,
  description: nullableString,
  units: nullableNumber,
  billedAmount: nullableNumber,
  allowedAmount: nullableNumber,
});

export const billDocumentContextSchema = z.object({
  summary: z.string(),
  providerName: nullableString,
  hospitalName: nullableString,
  insuranceProvider: nullableString,
  insurancePlan: nullableString,
  dateOfService: nullableString,
  billedAmount: nullableNumber,
  allowedAmount: nullableNumber,
  patientResponsibility: nullableNumber,
  lineItems: z.array(billLineItemSchema),
  missingFields: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  source: billDocumentSourceSchema,
  pageCount: z.number().int().positive().nullable(),
  pages: z.array(billDocumentPageSchema),
  documentMarkdown: z.string(),
  extractionNotes: z.array(z.string()),
});

export type BillDocumentContext = z.infer<typeof billDocumentContextSchema>;
export type BillDocumentSource = z.infer<typeof billDocumentSourceSchema>;

export const extractDocumentRequestSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.literal(CHAT_PDF_MIME_TYPE),
  sizeBytes: z.number().int().positive().max(MAX_CHAT_PDF_BYTES),
  dataUrl: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith(`data:${CHAT_PDF_MIME_TYPE};base64,`),
      "Expected a PDF base64 data URL",
    ),
});

export type ExtractDocumentRequest = z.infer<typeof extractDocumentRequestSchema>;

export function parseExtractedBillContext(value: unknown): BillDocumentContext {
  return billDocumentContextSchema.parse(value);
}

export function normalizeExtractedBillContext(
  value: unknown,
  source?: BillDocumentSource,
): BillDocumentContext {
  const record = isRecord(value) ? value : {};
  const proceduresValue = firstDefined(record.procedures, record.Procedures);
  const procedures = Array.isArray(proceduresValue) ? proceduresValue : [];
  const firstProcedure = isRecord(procedures[0]) ? procedures[0] : {};
  const procedureLocation = isRecord(firstProcedure.location)
    ? firstProcedure.location
    : {};
  const insurance = isRecord(firstProcedure.insurance) ? firstProcedure.insurance : {};
  const lineItemsValue = firstDefined(
    record.procedureLineItems,
    record.procedure_line_items,
    record.lineItems,
    record.line_items,
  );
  const lineItems = Array.isArray(lineItemsValue) ? lineItemsValue : [];
  const firstLineItem = isRecord(lineItems[0]) ? lineItems[0] : {};
  const normalizedPages = normalizePages(
    firstDefined(record.pages, record.pageText, record.page_text),
  );
  const documentMarkdown =
    stringValue(
      firstDefined(
        record.documentMarkdown,
        record.document_markdown,
        record.fullText,
        record.full_text,
      ),
    ) ?? buildDocumentMarkdown(normalizedPages);
  const rawPageCount = integerValue(firstDefined(record.pageCount, record.page_count));
  const pageCount =
    rawPageCount !== null && rawPageCount > 0
      ? rawPageCount
      : normalizedPages.length > 0
        ? normalizedPages.length
        : null;

  return parseExtractedBillContext({
    summary:
      stringValue(record.summary) ??
      buildSummary({
        procedureDescription: stringValue(
          firstDefined(
            firstProcedure.procedureDescription,
            firstProcedure.procedure_description,
          ),
        ),
        hospitalName: stringValue(
          firstDefined(
            record.hospitalName,
            record.hospital_name,
            record.hospital,
            firstProcedure.hospitalName,
            firstProcedure.hospital_name,
          ),
        ),
        city: stringValue(firstDefined(procedureLocation.city, record.city)),
        state: stringValue(firstDefined(procedureLocation.state, record.state)),
      }),
    providerName: stringValue(
      firstDefined(
        record.providerName,
        record.provider_name,
        record.provider,
        firstLineItem.providerName,
        firstLineItem.provider_name,
      ),
    ),
    hospitalName: stringValue(
      firstDefined(
        record.hospitalName,
        record.hospital_name,
        record.hospital,
        firstProcedure.hospitalName,
        firstProcedure.hospital_name,
      ),
    ),
    insuranceProvider: stringValue(
      firstDefined(
        record.insuranceProvider,
        record.insurance_provider,
        record.payer,
        insurance.providerName,
        insurance.provider_name,
      ),
    ),
    insurancePlan: stringValue(
      firstDefined(
        record.insurancePlan,
        record.insurance_plan,
        record.plan,
        insurance.planName,
        insurance.plan_name,
      ),
    ),
    dateOfService: stringValue(
      firstDefined(
        record.dateOfService,
        record.date_of_service,
        record.service_date,
        firstProcedure.dateOfProcedure,
        firstProcedure.date_of_procedure,
      ),
    ),
    billedAmount: numberValue(
      firstDefined(
        record.billedAmount,
        record.billed_amount,
        firstProcedure.billedAmount,
        firstProcedure.billed_amount,
      ),
    ),
    allowedAmount: numberValue(
      firstDefined(
        record.allowedAmount,
        record.allowed_amount,
        firstProcedure.allowedAmount,
        firstProcedure.allowed_amount,
      ),
    ),
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
        description: stringValue(
          firstDefined(line.description, line.serviceName, line.service_name),
        ),
        units,
        billedAmount:
          numberValue(firstDefined(line.billedAmount, line.billed_amount)) ??
          totalLineCharge(units, costPerUnit),
        allowedAmount: numberValue(
          firstDefined(line.allowedAmount, line.allowed_amount),
        ),
      };
    }),
    missingFields: stringArrayValue(
      firstDefined(record.missingFields, record.missing_fields),
    ),
    confidence: clampConfidence(numberValue(record.confidence) ?? 0.5),
    source: source ?? normalizeSource(record.source),
    pageCount,
    pages: normalizedPages,
    documentMarkdown,
    extractionNotes: stringArrayValue(
      firstDefined(record.extractionNotes, record.extraction_notes),
    ),
  });
}

export function validatePdfAttachmentSelection(files: FileList | File[]): {
  ok: true;
  file: File;
} | {
  ok: false;
  error: string;
} {
  const selected = Array.from(files);

  if (selected.length === 0) {
    return { ok: false, error: "Choose one PDF bill to attach." };
  }

  if (selected.length > 1) {
    return { ok: false, error: "Attach only one PDF for this MVP." };
  }

  const [file] = selected;
  if (!file) {
    return { ok: false, error: "Choose one PDF bill to attach." };
  }

  if (file.type !== CHAT_PDF_MIME_TYPE) {
    return { ok: false, error: "Only PDF files are supported." };
  }

  if (file.size > MAX_CHAT_PDF_BYTES) {
    return { ok: false, error: "PDF must be 3 MB or smaller." };
  }

  return { ok: true, file };
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

function normalizePages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    const page = isRecord(item) ? item : {};
    const pageNumber =
      integerValue(firstDefined(page.pageNumber, page.page_number, page.number)) ??
      index + 1;
    const text = stringValue(firstDefined(page.text, page.markdown, page.content)) ?? "";

    return pageNumber > 0 ? [{ pageNumber, text }] : [];
  });
}

function buildDocumentMarkdown(
  pages: Array<{ pageNumber: number; text: string }>,
) {
  return pages
    .map((page) => [`## Page ${page.pageNumber}`, page.text].join("\n\n").trim())
    .filter(Boolean)
    .join("\n\n");
}

function normalizeSource(value: unknown): BillDocumentSource {
  const source = isRecord(value) ? value : {};
  return billDocumentSourceSchema.parse({
    fileName: stringValue(source.fileName) ?? "uploaded-document.pdf",
    mimeType: source.mimeType,
    sizeBytes: integerValue(source.sizeBytes),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => value !== undefined);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function integerValue(value: unknown) {
  const parsed = numberValue(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function clampConfidence(value: number) {
  return Math.min(Math.max(value, 0), 1);
}
