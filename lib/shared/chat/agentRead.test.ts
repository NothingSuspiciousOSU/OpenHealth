import { describe, expect, it } from "vitest";
import {
  agentReadRequestSchema,
  MAX_AGENT_READ_LIMIT,
  normalizeAgentReadLimit,
} from "./agentRead";

describe("agent read request validation", () => {
  it("accepts allowlisted tables and bounded filters", () => {
    const request = agentReadRequestSchema.parse({
      table: "procedureLineItems",
      limit: 10,
      filters: {
        cptCode: "99284",
        state: "CA",
        city: "San Francisco",
        dateOfProcedureGte: 1735689600000,
      },
    });

    expect(request.table).toBe("procedureLineItems");
    expect(request.filters?.cptCode).toBe("99284");
  });

  it("rejects arbitrary tables and invalid filters", () => {
    expect(() =>
      agentReadRequestSchema.parse({
        table: "users",
        limit: 10,
      }),
    ).toThrow();

    expect(() =>
      agentReadRequestSchema.parse({
        table: "procedures",
        filters: { dateOfProcedureGte: 1.5 },
      }),
    ).toThrow();
  });

  it("caps normalized limits", () => {
    expect(normalizeAgentReadLimit(undefined)).toBe(25);
    expect(normalizeAgentReadLimit(0)).toBe(1);
    expect(normalizeAgentReadLimit(10.8)).toBe(10);
    expect(normalizeAgentReadLimit(500)).toBe(MAX_AGENT_READ_LIMIT);
  });
});
