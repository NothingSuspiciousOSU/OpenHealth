import { describe, expect, it } from "vitest";
import {
  CHAT_PDF_MIME_TYPE,
  MAX_CHAT_PDF_BYTES,
  parseExtractedBillContext,
  validatePdfAttachmentSelection,
} from "./documentContext";

describe("chat document context validation", () => {
  it("accepts one small PDF attachment", () => {
    const file = new File(["%PDF-1.7"], "bill.pdf", {
      type: CHAT_PDF_MIME_TYPE,
    });

    const result = validatePdfAttachmentSelection([file]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.name).toBe("bill.pdf");
    }
  });

  it("rejects missing, multiple, non-PDF, and oversized attachments", () => {
    const pdf = new File(["%PDF-1.7"], "bill.pdf", {
      type: CHAT_PDF_MIME_TYPE,
    });
    const text = new File(["hello"], "bill.txt", { type: "text/plain" });
    const largePdf = new File(
      [new Uint8Array(MAX_CHAT_PDF_BYTES + 1)],
      "large.pdf",
      { type: CHAT_PDF_MIME_TYPE },
    );

    expect(validatePdfAttachmentSelection([]).ok).toBe(false);
    expect(validatePdfAttachmentSelection([pdf, pdf]).ok).toBe(false);
    expect(validatePdfAttachmentSelection([text]).ok).toBe(false);
    expect(validatePdfAttachmentSelection([largePdf]).ok).toBe(false);
  });

  it("parses a structured extraction response", () => {
    const parsed = parseExtractedBillContext({
      summary: "Emergency department visit bill.",
      providerName: "Example Physicians",
      hospitalName: "Example Hospital",
      insuranceProvider: "Acme Health",
      insurancePlan: "PPO",
      dateOfService: "2026-01-10",
      billedAmount: 1200,
      allowedAmount: 450,
      patientResponsibility: 90,
      lineItems: [
        {
          cptCode: "99284",
          description: "Emergency department visit",
          units: 1,
          billedAmount: 1200,
          allowedAmount: 450,
        },
      ],
      missingFields: [],
      confidence: 0.86,
    });

    expect(parsed.lineItems[0]?.cptCode).toBe("99284");
    expect(parsed.allowedAmount).toBe(450);
  });

  it("rejects malformed extraction responses", () => {
    expect(() =>
      parseExtractedBillContext({
        summary: "Bad response",
        lineItems: [],
        missingFields: [],
        confidence: 2,
      }),
    ).toThrow();
  });
});
