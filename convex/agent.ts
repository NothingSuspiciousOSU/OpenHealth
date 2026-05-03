import { query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { Infer, v } from "convex/values";

const MAX_AGENT_READ_LIMIT = 100;

const agentFilterValidator = v.object({
  procedureId: v.optional(v.id("procedures")),
  cptCode: v.optional(v.string()),
  procedureDescriptionContains: v.optional(v.string()),
  serviceNameContains: v.optional(v.string()),
  hospitalName: v.optional(v.string()),
  state: v.optional(v.string()),
  city: v.optional(v.string()),
  insuranceProviderName: v.optional(v.string()),
  insurancePlanName: v.optional(v.string()),
  dateOfProcedureGte: v.optional(v.int64()),
  dateOfProcedureLte: v.optional(v.int64()),
});

type AgentFilters = Infer<typeof agentFilterValidator>;

export const describeDataModel = query({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    assertAgentToken(args.token);

    return {
      tables: {
        procedures: {
          description: "Medical procedure bill summaries.",
          fields: [
            "_id",
            "_creationTime",
            "procedureDescription",
            "dateOfProcedure",
            "hospitalName",
            "location.city",
            "location.state",
            "insurance.providerName",
            "insurance.planName",
            "billedAmount",
            "allowedAmount",
          ],
          indexes: [
            "by_dateOfProcedure",
            "by_hospitalName_and_dateOfProcedure",
            "by_locationState_locationCity_date",
            "by_insuranceProvider_insurancePlan_date",
          ],
        },
        procedureLineItems: {
          description: "Procedure line items with CPT/HCPCS codes and costs.",
          fields: [
            "_id",
            "_creationTime",
            "procedureId",
            "cptCode",
            "serviceName",
            "units",
            "costPerUnit",
            "providerName",
            "hospitalName",
            "city",
            "state",
            "insuranceProviderName",
            "insurancePlanName",
            "dateOfProcedure",
          ],
          indexes: [
            "by_procedureId",
            "by_cptCode_and_procedureId",
            "by_cptCode_hospitalName_date",
            "by_cptCode_state_city_date",
            "by_cptCode_insuranceProvider_insurancePlan_date",
          ],
        },
      },
      limits: {
        maxRowsPerRead: MAX_AGENT_READ_LIMIT,
        writable: false,
      },
    };
  },
});

export const readData = query({
  args: {
    token: v.string(),
    table: v.union(v.literal("procedures"), v.literal("procedureLineItems")),
    limit: v.optional(v.number()),
    filters: v.optional(agentFilterValidator),
  },
  handler: async (ctx, args) => {
    assertAgentToken(args.token);

    const limit = normalizeLimit(args.limit);
    const filters = args.filters ?? {};

    if (args.table === "procedures") {
      const rows = await readProcedures(ctx, filters, limit);
      return {
        table: args.table,
        rows,
        count: rows.length,
        limit,
      };
    }

    const rows = await readProcedureLineItems(ctx, filters, limit);
    return {
      table: args.table,
      rows,
      count: rows.length,
      limit,
    };
  },
});

function assertAgentToken(token: string) {
  const expected = process.env.AGENT_READ_TOKEN;
  if (!expected || token !== expected) {
    throw new Error("Unauthorized agent read");
  }
}

function normalizeLimit(limit: number | undefined) {
  if (limit === undefined) return 25;
  if (!Number.isFinite(limit)) return 25;
  return Math.min(Math.max(Math.floor(limit), 1), MAX_AGENT_READ_LIMIT);
}

async function readProcedures(
  ctx: QueryCtx,
  filters: AgentFilters,
  limit: number,
) {
  const takeLimit = Math.min(limit * 5, 500);
  let rows: Doc<"procedures">[];

  if (filters.hospitalName) {
    rows = await ctx.db
      .query("procedures")
      .withIndex("by_hospitalName_and_dateOfProcedure", (q) =>
        q.eq("hospitalName", filters.hospitalName!),
      )
      .take(takeLimit);
  } else if (filters.state && filters.city) {
    rows = await ctx.db
      .query("procedures")
      .withIndex("by_locationState_locationCity_date", (q) =>
        q.eq("location.state", filters.state!).eq("location.city", filters.city!),
      )
      .take(takeLimit);
  } else if (filters.insuranceProviderName && filters.insurancePlanName) {
    rows = await ctx.db
      .query("procedures")
      .withIndex("by_insuranceProvider_insurancePlan_date", (q) =>
        q
          .eq("insurance.providerName", filters.insuranceProviderName!)
          .eq("insurance.planName", filters.insurancePlanName!),
      )
      .take(takeLimit);
  } else {
    rows = await ctx.db.query("procedures").take(takeLimit);
  }

  return rows
    .filter((row) => procedureMatches(row, filters))
    .slice(0, limit)
    .map(serializeProcedure);
}

async function readProcedureLineItems(
  ctx: QueryCtx,
  filters: AgentFilters,
  limit: number,
) {
  const takeLimit = Math.min(limit * 5, 500);
  let rows: Doc<"procedureLineItems">[];

  if (filters.procedureId) {
    rows = await ctx.db
      .query("procedureLineItems")
      .withIndex("by_procedureId", (q) =>
        q.eq("procedureId", filters.procedureId as Id<"procedures">),
      )
      .take(takeLimit);
  } else if (filters.cptCode && filters.hospitalName) {
    rows = await ctx.db
      .query("procedureLineItems")
      .withIndex("by_cptCode_hospitalName_date", (q) =>
        q.eq("cptCode", filters.cptCode!).eq("hospitalName", filters.hospitalName!),
      )
      .take(takeLimit);
  } else if (filters.cptCode && filters.state && filters.city) {
    rows = await ctx.db
      .query("procedureLineItems")
      .withIndex("by_cptCode_state_city_date", (q) =>
        q.eq("cptCode", filters.cptCode!).eq("state", filters.state!).eq("city", filters.city!),
      )
      .take(takeLimit);
  } else if (
    filters.cptCode &&
    filters.insuranceProviderName &&
    filters.insurancePlanName
  ) {
    rows = await ctx.db
      .query("procedureLineItems")
      .withIndex("by_cptCode_insuranceProvider_insurancePlan_date", (q) =>
        q
          .eq("cptCode", filters.cptCode!)
          .eq("insuranceProviderName", filters.insuranceProviderName!)
          .eq("insurancePlanName", filters.insurancePlanName!),
      )
      .take(takeLimit);
  } else if (filters.cptCode) {
    rows = await ctx.db
      .query("procedureLineItems")
      .withIndex("by_cptCode_and_procedureId", (q) =>
        q.eq("cptCode", filters.cptCode!),
      )
      .take(takeLimit);
  } else {
    rows = await ctx.db.query("procedureLineItems").take(takeLimit);
  }

  return rows
    .filter((row) => lineItemMatches(row, filters))
    .slice(0, limit)
    .map(serializeLineItem);
}

function procedureMatches(row: Doc<"procedures">, filters: AgentFilters) {
  return (
    textContains(row.procedureDescription, filters.procedureDescriptionContains) &&
    equalsIfSet(row.hospitalName, filters.hospitalName) &&
    equalsIfSet(row.location.state, filters.state) &&
    equalsIfSet(row.location.city, filters.city) &&
    equalsIfSet(row.insurance.providerName, filters.insuranceProviderName) &&
    equalsIfSet(row.insurance.planName, filters.insurancePlanName) &&
    dateInRange(row.dateOfProcedure, filters)
  );
}

function lineItemMatches(row: Doc<"procedureLineItems">, filters: AgentFilters) {
  return (
    equalsIfSet(row.cptCode, filters.cptCode) &&
    textContains(row.serviceName ?? "", filters.serviceNameContains) &&
    equalsIfSet(row.hospitalName, filters.hospitalName) &&
    equalsIfSet(row.state, filters.state) &&
    equalsIfSet(row.city, filters.city) &&
    equalsIfSet(row.insuranceProviderName, filters.insuranceProviderName) &&
    equalsIfSet(row.insurancePlanName, filters.insurancePlanName) &&
    dateInRange(row.dateOfProcedure, filters)
  );
}

function equalsIfSet(actual: string, expected: string | undefined) {
  return expected === undefined || actual.toLowerCase() === expected.toLowerCase();
}

function textContains(actual: string, needle: string | undefined) {
  return (
    needle === undefined ||
    actual.toLowerCase().includes(needle.trim().toLowerCase())
  );
}

function dateInRange(value: bigint, filters: AgentFilters) {
  if (filters.dateOfProcedureGte !== undefined && value < filters.dateOfProcedureGte) {
    return false;
  }
  if (filters.dateOfProcedureLte !== undefined && value > filters.dateOfProcedureLte) {
    return false;
  }
  return true;
}

function serializeProcedure(row: Doc<"procedures">) {
  return {
    _id: row._id,
    _creationTime: row._creationTime,
    procedureDescription: row.procedureDescription,
    dateOfProcedure: Number(row.dateOfProcedure),
    hospitalName: row.hospitalName,
    location: row.location,
    insurance: row.insurance,
    billedAmount: Number(row.billedAmount),
    allowedAmount: Number(row.allowedAmount),
  };
}

function serializeLineItem(row: Doc<"procedureLineItems">) {
  return {
    _id: row._id,
    _creationTime: row._creationTime,
    procedureId: row.procedureId,
    cptCode: row.cptCode,
    serviceName: row.serviceName ?? null,
    units: Number(row.units),
    costPerUnit: Number(row.costPerUnit),
    providerName: row.providerName ?? null,
    hospitalName: row.hospitalName,
    city: row.city,
    state: row.state,
    insuranceProviderName: row.insuranceProviderName,
    insurancePlanName: row.insurancePlanName,
    dateOfProcedure: Number(row.dateOfProcedure),
  };
}
