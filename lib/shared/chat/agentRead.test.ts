import { describe, expect, it } from "vitest";
import {
  agentAggregateDataRequestSchema,
  agentQueryDataRequestSchema,
  agentReadRequestSchema,
  MAX_AGENT_READ_LIMIT,
  normalizeAgentReadLimit,
} from "./agentRead";

describe("agent read request validation", () => {
  it("accepts allowlisted tables and query DSL clauses", () => {
    const request = agentReadRequestSchema.parse({
      table: "procedureLineItems",
      limit: 10,
      where: [
        { field: "cptCode", op: "eq", value: "99284" },
        { field: "state", op: "eq", value: "CA" },
        { field: "city", op: "eq", value: "San Francisco" },
        { field: "dateOfProcedure", op: "gte", value: 1735689600000 },
      ],
      include: ["procedure"],
    });

    expect(request.table).toBe("procedureLineItems");
    expect(request.where?.[0]?.field).toBe("cptCode");
  });

  it("accepts rich query and aggregate request shapes", () => {
    const query = agentQueryDataRequestSchema.parse({
      table: "procedures",
      search: { field: "procedureDescription", text: "MRI" },
      where: [
        { field: "location.state", op: "eq", value: "CA" },
        { field: "billedAmount", op: "lte", value: 5000 },
      ],
      sort: { field: "allowedAmount", direction: "asc" },
      include: ["lineItems"],
      cursor: 25,
      limit: 25,
    });

    expect(query.search?.field).toBe("procedureDescription");
    expect(query.include).toContain("lineItems");

    const aggregate = agentAggregateDataRequestSchema.parse({
      table: "procedureLineItems",
      where: [{ field: "cptCode", op: "in", value: ["99284", "99285"] }],
      groupBy: ["hospitalName", "insuranceProviderName"],
      metrics: [
        { op: "count" },
        { op: "median", field: "lineTotal" },
        { op: "avg", field: "costPerUnit" },
      ],
    });

    expect(aggregate.metrics?.[1]?.field).toBe("lineTotal");
  });

  it("rejects arbitrary tables and malformed DSL values", () => {
    expect(() =>
      agentReadRequestSchema.parse({
        table: "users",
        limit: 10,
      }),
    ).toThrow();

    expect(() =>
      agentReadRequestSchema.parse({
        table: "procedures",
        where: [{ field: "dateOfProcedure", op: "gte", value: 1.5 }],
      }),
    ).toThrow();

    expect(() =>
      agentQueryDataRequestSchema.parse({
        table: "procedureLineItems",
        where: [{ field: "cptCode", op: "eq", value: ["99284"] }],
      }),
    ).toThrow();
  });

  it("rejects fields and relationships unsupported by the selected table", () => {
    expect(() =>
      agentAggregateDataRequestSchema.parse({
        table: "procedureLineItems",
        metrics: [{ op: "median", field: "allowedAmount" }],
      }),
    ).toThrow(/not aggregatable/);

    expect(() =>
      agentQueryDataRequestSchema.parse({
        table: "procedureLineItems",
        where: [{ field: "allowedAmount", op: "lte", value: 1000 }],
      }),
    ).toThrow(/not available/);

    expect(() =>
      agentQueryDataRequestSchema.parse({
        table: "procedures",
        include: ["procedure"],
      }),
    ).toThrow(/Relationship/);
  });

  it("caps normalized limits", () => {
    expect(normalizeAgentReadLimit(undefined)).toBe(25);
    expect(normalizeAgentReadLimit(0)).toBe(1);
    expect(normalizeAgentReadLimit(10.8)).toBe(10);
    expect(normalizeAgentReadLimit(500)).toBe(MAX_AGENT_READ_LIMIT);
  });
});
