import { z } from "zod";

export const MAX_CHAT_PDF_BYTES = 3 * 1024 * 1024;
export const CHAT_PDF_MIME_TYPE = "application/pdf";

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();

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
});

export type BillDocumentContext = z.infer<typeof billDocumentContextSchema>;

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
