import "server-only";

import { stepCountIs, tool, ToolLoopAgent } from "ai";
import { z } from "zod";
import {
  agentAggregateDataRequestSchema,
  agentQueryDataRequestSchema,
} from "@/lib/shared/chat/agentRead";
import { BillDocumentContext } from "@/lib/shared/chat/documentContext";
import {
  aggregateConvexAgentData,
  describeConvexDataModel,
  queryConvexAgentData,
} from "./convexAgent";
import { getNemotronModelId, getOpenRouterProvider } from "./openrouter";
import { searchWithTavily } from "./tavily";

function buildInstructions(documentContext?: BillDocumentContext) {
  const documentContextText = formatDocumentContext(documentContext);
  const hasBillContext = Boolean(documentContext);

  return [
    "You are the OpenHealth medical bill transparency agent.",
    "",
    "Your job is to help users understand medical bills, compare billed and allowed prices against OpenHealth data, and identify practical questions to ask a provider or insurer.",
    "",
    "You are not a doctor, lawyer, insurer, or claims adjudicator. Do not diagnose, give legal advice, guarantee coverage, or claim that a bill is definitively wrong. Explain uncertainty clearly.",
    "",
    "Available tools:",
    "",
    "1. convexDatabaseAgent",
    "Use this for OpenHealth internal data:",
    "- procedure and line-item price comparisons",
    "- procedure records",
    "- hospital, location, insurance, CPT, and service-name filtering",
    "- OpenHealth billed and allowed amount comparisons",
    "",
    'Use action "describeDataModel" when you need to understand available fields, filters, relationships, or aggregation options.',
    'Use action "queryData" when retrieving matching rows with filters, search, sorting, pagination, or relationship includes.',
    'Use action "aggregateData" when the user asks for ranges, typical prices, medians, averages, counts, trends, comparisons, or "is this high".',
    'Use table "procedures" for procedure-level billed/allowed comparisons.',
    'Use table "procedureLineItems" for itemized CPT/service-line comparisons.',
    'On table "procedures", aggregate dollar fields are "billedAmount" and "allowedAmount".',
    'On table "procedureLineItems", aggregate dollar fields are "lineTotal" and "costPerUnit"; there is no "allowedAmount" field on procedureLineItems.',
    "",
    "DSL basics:",
    '- For `queryData`, put `table`, `where`, `search`, `sort`, `include`, `limit`, and `cursor` at the top level of the tool input with `action: "queryData"`.',
    '- For `aggregateData`, put `table`, `where`, `search`, `groupBy`, `metrics`, and `limit` at the top level of the tool input with `action: "aggregateData"`.',
    '- Filters are `where` conditions with `field`, `op`, and `value`; supported ops are "eq", "contains", "gte", "lte", and "in".',
    '- Text search uses `search` with declared search fields: "procedureDescription", "cptCode", or "serviceName".',
    '- Use `include: ["procedure"]` on procedureLineItems when parent bill context helps.',
    '- Use `include: ["lineItems"]` on procedures when itemized CPT details help.',
    '- For line-item total comparisons, aggregate field "lineTotal", not "allowedAmount".',
    'Example queryData input: `{ "action": "queryData", "table": "procedureLineItems", "where": [{ "field": "cptCode", "op": "eq", "value": "99284" }], "include": ["procedure"], "limit": 25 }`.',
    'Example aggregateData input: `{ "action": "aggregateData", "table": "procedureLineItems", "where": [{ "field": "cptCode", "op": "eq", "value": "99284" }], "metrics": [{ "op": "count" }, { "op": "median", "field": "lineTotal" }] }`.',
    "",
    "Start with focused filters. If no matches are returned, read the diagnostics, broaden by dropping the most specific filters first, and do not repeat the same exact empty query.",
    "",
    "2. webResearchAgent",
    "Use this only for public external context:",
    "- CPT or billing terminology definitions",
    "- payer or policy background",
    "- medical billing concepts",
    "- current public information",
    "",
    "Do not use webResearchAgent for OpenHealth price data.",
    "When you use web results, cite the returned URLs in your answer.",
    "",
    "3. priceReasoningAgent",
    "Use this to compute statistical comparisons between the user's bill amounts and OpenHealth comparison rows.",
    "Returns: percentile, zScore, isOutlier (true if |zScore| > 2), stdDev, mean, median, Q1, Q3, IQR.",
    "Use it after collecting relevant comparison rows. Feed it the comparison amounts collected from queryData results.",
    "",
    "4. reportProgress",
    "Emit a short human-readable status message displayed in the audit trace UI.",
    "Call this BEFORE each major step so the user sees real-time progress.",
    "Examples:",
    '- "Read uploaded bill"',
    '- "Identified procedure: Emergency room visit"',
    '- "Found CPT codes: 99284, 93005"',
    '- "Searching comparable procedures in Oregon"',
    '- "Relaxed insurance filter because only 2 exact matches were found"',
    '- "Retrieved 31 comparable procedures"',
    '- "Compared line items and allowed amounts"',
    '- "Found 3 potential billing issues"',
    "",
    "5. errorConfidenceAgent",
    "Call this ONCE at the end of every bill audit to produce an Error Confidence Score (0-100).",
    "Score guidelines:",
    "- 0-20: likely correct — charges appear normal",
    "- 21-40: minor concerns — small discrepancies or missing context",
    "- 41-60: moderate concerns — some charges look unusual",
    "- 61-80: likely errors — multiple charges deviate significantly",
    "- 81-100: strong evidence — clear outliers, duplicates, or known billing patterns",
    "Factors to consider: price vs distribution (percentile, zScore), duplicate CPT codes, unbundling patterns, unusual units, billed-vs-allowed gap, missing modifiers, comparison data availability.",
    "",
    "Always distinguish:",
    "- billed amount: what the provider charged",
    "- allowed amount: what the insurer/network contract allowed",
    "- patient responsibility: what the patient may owe after insurance processing",
    "",
    "Patient responsibility depends on deductible, copay, coinsurance, network status, coverage rules, and claim adjudication. Never present it as certain unless the bill explicitly states it.",
    "",
    "Workflow:",
    "- Call reportProgress at each major step.",
    "- First, understand the user's question and the extracted bill context.",
    hasBillContext
      ? "- A bill context is available. Use structured fields such as CPT codes, service descriptions, hospital, insurer, dates, and amounts as exact query inputs when relevant."
      : "- No bill context is available. If the user asks to audit a bill, ask them to attach the bill PDF or paste CPT/service lines and amounts before querying OpenHealth data.",
    "- Prefer structured extracted bill facts for exact OpenHealth filters and calculations.",
    "- Consult the full extracted document text whenever the user asks about anything not represented in the structured fields.",
    "- For each line item on the bill, query the database for matching CPT code prices using queryData or aggregateData, then feed the comparison amounts into priceReasoningAgent. Report the percentile rank, zScore, and whether it is an outlier.",
    "- If a filter returns few results (< 5), broaden by relaxing the most specific filter (e.g., insurance plan, then city) and note that you broadened the search.",
    "- If the user asks about prices, fairness, or whether something looks high, use OpenHealth data.",
    "- If the user asks what a CPT code or billing term means, use webResearchAgent.",
    "- Do not call tools unnecessarily when the answer is already contained in the provided bill context.",
    "- If OpenHealth returns no matches, say so and suggest broader filters.",
    "- At the end of a bill audit, always call errorConfidenceAgent with a score and reasoning factors.",
    "",
    "Answer style:",
    "- Be direct, practical, and concise.",
    "- Lead with the most useful conclusion.",
    "- Show the evidence used: bill context, OpenHealth records, web sources, or calculation results.",
    '- Avoid overclaiming. Use phrases like "based on the available OpenHealth records" and "this suggests" when appropriate.',
    "- End with concrete next steps or questions the user can ask their provider or insurer when relevant.",
    "- Do not expose raw tool JSON unless the user asks for it.",
    "",
    "Current extracted bill context:",
    documentContextText,
  ].join("\n");
}

function formatDocumentContext(documentContext?: BillDocumentContext) {
  if (!documentContext) {
    return "No bill PDF context was provided for this turn.";
  }

  const { documentMarkdown, pages, ...structuredContext } = documentContext;
  const fullDocumentText =
    documentMarkdown.trim() ||
    pages
      .map((page) => [`## Page ${page.pageNumber}`, page.text].join("\n\n"))
      .join("\n\n");

  return [
    "Structured extracted bill facts:",
    JSON.stringify(structuredContext, null, 2),
    "",
    "Full extracted document text:",
    fullDocumentText || "No full document text was extracted.",
  ].join("\n");
}

export function createOpenHealthChatAgent(documentContext?: BillDocumentContext) {
  const openrouter = getOpenRouterProvider();

  return new ToolLoopAgent({
    model: openrouter(getNemotronModelId()),
    instructions: buildInstructions(documentContext),
    stopWhen: stepCountIs(20),
    maxOutputTokens: 5000,
    tools: {
      webResearchAgent: tool({
        description:
          "Search public web sources for CPT definitions, billing terminology, and external medical billing context. Do not use for OpenHealth internal price data.",
        inputSchema: z.object({
          query: z.string().min(3),
          maxResults: z.number().int().min(1).max(8).optional(),
        }),
        execute: async ({ query, maxResults }) => {
          try {
            const results = await searchWithTavily({ query, maxResults });
            return { ok: true, ...results };
          } catch (error) {
            return {
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : "External web search was unavailable.",
            };
          }
        },
      }),
      convexDatabaseAgent: tool({
        description:
          "Read and aggregate OpenHealth procedure and line-item data through a bounded, read-only, schema-aware Convex query DSL.",
        inputSchema: z.discriminatedUnion("action", [
          z.object({ action: z.literal("describeDataModel") }),
          agentQueryDataRequestSchema.extend({
            action: z.literal("queryData"),
          }),
          agentAggregateDataRequestSchema.extend({
            action: z.literal("aggregateData"),
          }),
        ]),
        execute: async (input) => {
          try {
            if (input.action === "describeDataModel") {
              const model = await describeConvexDataModel();
              return { ok: true, model };
            }

            if (input.action === "queryData") {
              const query = agentQueryDataRequestSchema.parse(input);
              const data = await queryConvexAgentData(query);
              return { ok: true, data };
            }

            const aggregate = agentAggregateDataRequestSchema.parse(input);
            const data = await aggregateConvexAgentData(aggregate);
            return { ok: true, data };
          } catch (error) {
            return {
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : "OpenHealth price data could not be queried.",
            };
          }
        },
      }),
      priceReasoningAgent: tool({
        description:
          "Compute simple price comparison statistics from bill amounts and OpenHealth comparison rows.",
        inputSchema: z.object({
          billedAmount: z.number().nullable().optional(),
          allowedAmount: z.number().nullable().optional(),
          patientResponsibility: z.number().nullable().optional(),
          comparisonAllowedAmounts: z.array(z.number()).max(100).optional(),
          comparisonBilledAmounts: z.array(z.number()).max(100).optional(),
        }),
        execute: async ({
          billedAmount,
          allowedAmount,
          patientResponsibility,
          comparisonAllowedAmounts = [],
          comparisonBilledAmounts = [],
        }) => {
          return {
            billed: summarizeAmount(billedAmount, comparisonBilledAmounts),
            allowed: summarizeAmount(allowedAmount, comparisonAllowedAmounts),
            patientResponsibility: {
              amount: patientResponsibility ?? null,
              note:
                "Patient responsibility depends on plan design, deductible, copay, coinsurance, network status, and claim adjudication.",
            },
          };
        },
      }),
      reportProgress: tool({
        description:
          "Emit a short, human-readable progress message that will be displayed in the audit trace UI. Call this at key workflow steps so the user can see what the agent is doing.",
        inputSchema: z.object({
          message: z.string().min(1).max(200),
        }),
        execute: async ({ message }) => {
          return { ok: true, message };
        },
      }),
      errorConfidenceAgent: tool({
        description:
          "Produce a structured Error Confidence Score (0-100) indicating the likelihood the bill contains a meaningful error. Call this once at the end of every bill audit.",
        inputSchema: z.object({
          score: z.number().int().min(0).max(100),
          summary: z.string().min(1).max(500),
          factors: z.array(
            z.object({
              factor: z.string(),
              impact: z.enum(["increases", "decreases", "neutral"]),
              weight: z.number().min(0).max(1),
              explanation: z.string(),
            }),
          ).min(1).max(12),
        }),
        execute: async ({ score, summary, factors }) => {
          let level: string;
          if (score <= 20) level = "likely_correct";
          else if (score <= 40) level = "minor_concerns";
          else if (score <= 60) level = "moderate_concerns";
          else if (score <= 80) level = "likely_errors";
          else level = "strong_evidence";
          return { ok: true, score, level, summary, factors };
        },
      }),
    },
  });
}

function summarizeAmount(
  amount: number | null | undefined,
  comparisons: number[],
) {
  const sorted = comparisons
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  const med = calcMedian(sorted);
  const avg = calcMean(sorted);
  const sd = calcStdDev(sorted, avg);
  const q1 = calcMedian(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q3 = calcMedian(sorted.slice(Math.ceil(sorted.length / 2)));
  const iqr = q1 !== null && q3 !== null ? round2(q3 - q1) : null;

  const base = {
    comparisonCount: sorted.length,
    min: sorted[0] ?? null,
    max: sorted[sorted.length - 1] ?? null,
    median: med,
    mean: avg !== null ? round2(avg) : null,
    stdDev: sd !== null ? round2(sd) : null,
    q1,
    q3,
    iqr,
  };

  if (amount === null || amount === undefined) {
    return { amount: null, percentile: null, zScore: null, isOutlier: false, ...base };
  }

  const lessOrEqual = sorted.filter((value) => value <= amount).length;
  const percentile =
    sorted.length === 0 ? null : Math.round((lessOrEqual / sorted.length) * 100);
  const zScore =
    avg !== null && sd !== null && sd > 0 ? round2((amount - avg) / sd) : null;
  const isOutlier = zScore !== null && Math.abs(zScore) > 2;

  return { amount, percentile, zScore, isOutlier, ...base };
}

function calcMedian(values: number[]) {
  if (values.length === 0) return null;
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) return values[middle];
  return round2((values[middle - 1] + values[middle]) / 2);
}

function calcMean(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calcStdDev(values: number[], mean: number | null) {
  if (values.length < 2 || mean === null) return null;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}
