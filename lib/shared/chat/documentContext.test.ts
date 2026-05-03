import { describe, expect, it } from "vitest";
import {
  CHAT_PDF_MIME_TYPE,
  MAX_CHAT_PDF_BYTES,
  normalizeExtractedBillContext,
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
      source: {
        fileName: "bill.pdf",
        mimeType: CHAT_PDF_MIME_TYPE,
        sizeBytes: 1234,
      },
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          text: "Example Hospital\n\n| Code | Charge |\n| --- | --- |\n| 99284 | $1,200.00 |",
        },
      ],
      documentMarkdown:
        "## Page 1\n\nExample Hospital\n\n| Code | Charge |\n| --- | --- |\n| 99284 | $1,200.00 |",
      extractionNotes: ["Clear selectable text."],
    });

    expect(parsed.lineItems[0]?.cptCode).toBe("99284");
    expect(parsed.allowedAmount).toBe(450);
    expect(parsed.source.fileName).toBe("bill.pdf");
    expect(parsed.pages[0]?.text).toContain("Example Hospital");
    expect(parsed.documentMarkdown).toContain("## Page 1");
  });

  it("normalizes partial extraction responses into enriched context", () => {
    const normalized = normalizeExtractedBillContext(
      {
        summary: "Emergency department visit bill.",
        provider_name: "Example Physicians",
        billed_amount: "$1,200.00",
        line_items: [
          {
            code: "99284",
            service_name: "Emergency department visit",
            units: "1",
            allowed_amount: "$450.00",
          },
        ],
        pages: [{ page_number: "1", markdown: "Example bill text" }],
        confidence: 1.3,
      },
      {
        fileName: "bill.pdf",
        mimeType: CHAT_PDF_MIME_TYPE,
        sizeBytes: 1234,
      },
    );

    expect(normalized.providerName).toBe("Example Physicians");
    expect(normalized.billedAmount).toBe(1200);
    expect(normalized.lineItems[0]?.allowedAmount).toBe(450);
    expect(normalized.confidence).toBe(1);
    expect(normalized.pageCount).toBe(1);
    expect(normalized.documentMarkdown).toContain("Example bill text");
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
