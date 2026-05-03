import { query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { Infer, v } from "convex/values";

const MAX_AGENT_READ_LIMIT = 100;
const MAX_AGENT_SCAN_LIMIT = 500;
const MAX_AGENT_GROUPS = 25;
const DEFAULT_QUERY_LIMIT = 25;

const tableValidator = v.union(
  v.literal("procedures"),
  v.literal("procedureLineItems"),
);

const procedureFieldValidator = v.union(
  v.literal("_id"),
  v.literal("_creationTime"),
  v.literal("procedureDescription"),
  v.literal("dateOfProcedure"),
  v.literal("hospitalName"),
  v.literal("location.city"),
  v.literal("location.state"),
  v.literal("insurance.providerName"),
  v.literal("insurance.planName"),
  v.literal("billedAmount"),
  v.literal("allowedAmount"),
);

const lineItemFieldValidator = v.union(
  v.literal("_id"),
  v.literal("_creationTime"),
  v.literal("procedureId"),
  v.literal("cptCode"),
  v.literal("serviceName"),
  v.literal("units"),
  v.literal("costPerUnit"),
  v.literal("lineTotal"),
  v.literal("providerName"),
  v.literal("hospitalName"),
  v.literal("city"),
  v.literal("state"),
  v.literal("insuranceProviderName"),
  v.literal("insurancePlanName"),
  v.literal("dateOfProcedure"),
);

const fieldValidator = v.union(procedureFieldValidator, lineItemFieldValidator);
const scalarValueValidator = v.union(v.string(), v.number(), v.int64());

const whereConditionValidator = v.object({
  field: fieldValidator,
  op: v.union(
    v.literal("eq"),
    v.literal("contains"),
    v.literal("gte"),
    v.literal("lte"),
    v.literal("in"),
  ),
  value: v.union(scalarValueValidator, v.array(scalarValueValidator)),
});

const searchValidator = v.object({
  field: v.union(
    v.literal("procedureDescription"),
    v.literal("cptCode"),
    v.literal("serviceName"),
  ),
  text: v.string(),
});

const sortValidator = v.object({
  field: fieldValidator,
  direction: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
});

const includeValidator = v.union(v.literal("procedure"), v.literal("lineItems"));

const metricValidator = v.object({
  op: v.union(
    v.literal("count"),
    v.literal("min"),
    v.literal("max"),
    v.literal("avg"),
    v.literal("median"),
    v.literal("sum"),
  ),
  field: v.optional(fieldValidator),
});

type AgentTable = Infer<typeof tableValidator>;
type AgentField = Infer<typeof fieldValidator>;
type WhereCondition = Infer<typeof whereConditionValidator>;
type SearchRequest = Infer<typeof searchValidator>;
type SortRequest = Infer<typeof sortValidator>;
type IncludeRequest = Infer<typeof includeValidator>;
type MetricRequest = Infer<typeof metricValidator>;
type ProcedureRow = Doc<"procedures">;
type LineItemRow = Doc<"procedureLineItems">;
type AgentRow = ProcedureRow | LineItemRow;
type SerializedRow = Record<string, unknown>;

const FIELD_METADATA: Record<
  AgentTable,
  Record<
    string,
    {
      type: string;
      description: string;
      filterable?: boolean;
      searchable?: boolean;
      sortable?: boolean;
      groupable?: boolean;
      aggregatable?: boolean;
      operators?: string[];
    }
  >
> = {
  procedures: {
    _id: {
      type: "id",
      description: "Stable Convex procedure id for follow-up queries.",
      filterable: true,
      operators: ["eq", "in"],
    },
    _creationTime: {
      type: "number",
      description: "Convex document creation time in milliseconds.",
      filterable: true,
      sortable: true,
      operators: ["gte", "lte"],
    },
    procedureDescription: {
      type: "string",
      description: "Procedure-level description of the bill or encounter.",
      filterable: true,
      searchable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    dateOfProcedure: {
      type: "integerMilliseconds",
      description: "Date of procedure as epoch milliseconds.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "gte", "lte", "in"],
    },
    hospitalName: {
      type: "string",
      description: "Hospital or facility name.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    "location.city": {
      type: "string",
      description: "Procedure city.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    "location.state": {
      type: "string",
      description: "Procedure state abbreviation.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "in"],
    },
    "insurance.providerName": {
      type: "string",
      description: "Insurance carrier or payer name.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    "insurance.planName": {
      type: "string",
      description: "Insurance plan name.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    billedAmount: {
      type: "integerDollars",
      description: "Total amount billed by the provider.",
      filterable: true,
      sortable: true,
      aggregatable: true,
      operators: ["eq", "gte", "lte", "in"],
    },
    allowedAmount: {
      type: "integerDollars",
      description: "Contracted or allowed amount.",
      filterable: true,
      sortable: true,
      aggregatable: true,
      operators: ["eq", "gte", "lte", "in"],
    },
  },
  procedureLineItems: {
    _id: {
      type: "id",
      description: "Stable Convex line-item id.",
      filterable: true,
      operators: ["eq", "in"],
    },
    _creationTime: {
      type: "number",
      description: "Convex document creation time in milliseconds.",
      filterable: true,
      sortable: true,
      operators: ["gte", "lte"],
    },
    procedureId: {
      type: "id",
      description: "Parent procedure id.",
      filterable: true,
      groupable: true,
      operators: ["eq", "in"],
    },
    cptCode: {
      type: "string",
      description: "CPT or HCPCS billing code.",
      filterable: true,
      searchable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    serviceName: {
      type: "string|null",
      description: "Line-item service name or description.",
      filterable: true,
      searchable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    units: {
      type: "integer",
      description: "Line-item unit count.",
      filterable: true,
      sortable: true,
      aggregatable: true,
      operators: ["eq", "gte", "lte", "in"],
    },
    costPerUnit: {
      type: "integerDollars",
      description: "Line-item cost per unit.",
      filterable: true,
      sortable: true,
      aggregatable: true,
      operators: ["eq", "gte", "lte", "in"],
    },
    lineTotal: {
      type: "integerDollars",
      description: "Computed units multiplied by costPerUnit.",
      filterable: true,
      sortable: true,
      aggregatable: true,
      operators: ["eq", "gte", "lte", "in"],
    },
    providerName: {
      type: "string|null",
      description: "Rendering or billing provider name when available.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    hospitalName: {
      type: "string",
      description: "Hospital or facility name copied from the parent procedure.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    city: {
      type: "string",
      description: "Line-item facility city.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    state: {
      type: "string",
      description: "Line-item facility state abbreviation.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "in"],
    },
    insuranceProviderName: {
      type: "string",
      description: "Insurance carrier or payer name.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    insurancePlanName: {
      type: "string",
      description: "Insurance plan name.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "contains", "in"],
    },
    dateOfProcedure: {
      type: "integerMilliseconds",
      description: "Date of procedure as epoch milliseconds.",
      filterable: true,
      sortable: true,
      groupable: true,
      operators: ["eq", "gte", "lte", "in"],
    },
  },
};

export const describeDataModel = query({
  args: {
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    assertAgentToken(args.token);

    return {
      access: {
        writable: false,
        authorization: "Requires AGENT_READ_TOKEN.",
        allowedTables: ["procedures", "procedureLineItems"],
      },
      limits: {
        maxRowsPerQuery: MAX_AGENT_READ_LIMIT,
        maxRowsScannedPerQuery: MAX_AGENT_SCAN_LIMIT,
        maxAggregateGroups: MAX_AGENT_GROUPS,
      },
      actions: {
        queryData:
          "Read allowlisted rows with typed filters, text search, sorting, pagination, and controlled relationship includes.",
        aggregateData:
          "Group allowlisted rows and compute count, min, max, avg, median, or sum metrics.",
      },
      tables: {
        procedures: {
          description: "Medical procedure bill summaries.",
          fields: FIELD_METADATA.procedures,
          searchFields: ["procedureDescription"],
          sortableFields: metadataFields("procedures", "sortable"),
          groupableFields: metadataFields("procedures", "groupable"),
          aggregatableFields: metadataFields("procedures", "aggregatable"),
          relationships: {
            lineItems: {
              include: "lineItems",
              description:
                "Procedure rows can include matching procedureLineItems by procedureId.",
            },
          },
          indexes: [
            "by_dateOfProcedure",
            "by_hospitalName_and_dateOfProcedure",
            "by_locationState_locationCity_date",
            "by_insuranceProvider_insurancePlan_date",
            "search_description",
          ],
        },
        procedureLineItems: {
          description: "Procedure line items with CPT/HCPCS codes and costs.",
          fields: FIELD_METADATA.procedureLineItems,
          searchFields: ["cptCode", "serviceName"],
          sortableFields: metadataFields("procedureLineItems", "sortable"),
          groupableFields: metadataFields("procedureLineItems", "groupable"),
          aggregatableFields: metadataFields("procedureLineItems", "aggregatable"),
          relationships: {
            procedure: {
              include: "procedure",
              description:
                "Line-item rows can include their parent procedure summary by procedureId.",
            },
          },
          indexes: [
            "by_procedureId",
            "by_cptCode_and_procedureId",
            "by_cptCode_hospitalName_date",
            "by_cptCode_state_city_date",
            "by_cptCode_insuranceProvider_insurancePlan_date",
            "search_cpt",
            "search_service",
          ],
        },
      },
      examples: [
        {
          question: "Is CPT 99284 expensive in California?",
          action: "aggregateData",
          request: {
            table: "procedureLineItems",
            where: [
              { field: "cptCode", op: "eq", value: "99284" },
              { field: "state", op: "eq", value: "CA" },
            ],
            groupBy: ["hospitalName"],
            metrics: [
              { op: "count" },
              { op: "median", field: "lineTotal" },
              { op: "avg", field: "lineTotal" },
            ],
          },
        },
        {
          question: "Find MRI bills near San Francisco.",
          action: "queryData",
          request: {
            table: "procedures",
            search: { field: "procedureDescription", text: "MRI" },
            where: [{ field: "location.city", op: "eq", value: "San Francisco" }],
            include: ["lineItems"],
          },
        },
      ],
    };
  },
});

export const queryData = query({
  args: {
    token: v.string(),
    table: tableValidator,
    where: v.optional(v.array(whereConditionValidator)),
    search: v.optional(searchValidator),
    sort: v.optional(sortValidator),
    include: v.optional(v.array(includeValidator)),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertAgentToken(args.token);
    const limit = normalizeLimit(args.limit, MAX_AGENT_READ_LIMIT, DEFAULT_QUERY_LIMIT);
    const cursor = normalizeCursor(args.cursor);
    const where = args.where ?? [];
    const include = args.include ?? [];

    validateQueryRequest(args.table, where, args.search, args.sort, include);

    const candidates = await loadCandidateRows(ctx, {
      table: args.table,
      where,
      search: args.search,
      scanLimit: MAX_AGENT_SCAN_LIMIT,
    });
    const filtered = candidates.rows.filter((row) =>
      rowMatches(args.table, row, where),
    );
    const sorted = sortRows(args.table, filtered, args.sort);
    const page = sorted.slice(cursor, cursor + limit);
    const rows = await serializeRows(ctx, args.table, page, include);
    const nextCursor = cursor + rows.length;

    return {
      table: args.table,
      rows,
      count: rows.length,
      page: {
        limit,
        cursor,
        nextCursor: nextCursor < sorted.length ? nextCursor : null,
        hasMore: nextCursor < sorted.length,
      },
      diagnostics: await buildDiagnostics(ctx, {
        table: args.table,
        where,
        search: args.search,
        candidateCount: candidates.rows.length,
        filteredCount: filtered.length,
        returnedCount: rows.length,
        scanLimit: MAX_AGENT_SCAN_LIMIT,
        warnings: candidates.warnings,
      }),
    };
  },
});

export const aggregateData = query({
  args: {
    token: v.string(),
    table: tableValidator,
    where: v.optional(v.array(whereConditionValidator)),
    search: v.optional(searchValidator),
    groupBy: v.optional(v.array(fieldValidator)),
    metrics: v.optional(v.array(metricValidator)),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertAgentToken(args.token);
    const where = args.where ?? [];
    const groupBy = args.groupBy ?? [];
    const metrics = args.metrics ?? [{ op: "count" as const }];
    const limit = normalizeLimit(args.limit, MAX_AGENT_GROUPS, MAX_AGENT_GROUPS);

    validateAggregateRequest(args.table, where, args.search, groupBy, metrics);

    const candidates = await loadCandidateRows(ctx, {
      table: args.table,
      where,
      search: args.search,
      scanLimit: MAX_AGENT_SCAN_LIMIT,
    });
    const filtered = candidates.rows.filter((row) =>
      rowMatches(args.table, row, where),
    );
    const groups = aggregateRows(args.table, filtered, groupBy, metrics).slice(
      0,
      limit,
    );

    return {
      table: args.table,
      groups,
      count: groups.length,
      diagnostics: await buildDiagnostics(ctx, {
        table: args.table,
        where,
        search: args.search,
        candidateCount: candidates.rows.length,
        filteredCount: filtered.length,
        returnedCount: groups.length,
        scanLimit: MAX_AGENT_SCAN_LIMIT,
        warnings: candidates.warnings,
      }),
    };
  },
});

// Backward-compatible alias for older callers. New chat tooling should use queryData.
export const readData = query({
  args: {
    token: v.string(),
    table: tableValidator,
    limit: v.optional(v.number()),
    filters: v.optional(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, args) => {
    assertAgentToken(args.token);
    const filters = args.filters ?? {};
    const where: WhereCondition[] = [];
    if ("procedureId" in filters && filters.procedureId) {
      where.push({ field: "procedureId", op: "eq", value: filters.procedureId });
    }
    if (filters.cptCode) {
      where.push({ field: "cptCode", op: "eq", value: filters.cptCode });
    }
    if (filters.procedureDescriptionContains) {
      where.push({
        field: "procedureDescription",
        op: "contains",
        value: filters.procedureDescriptionContains,
      });
    }
    if (filters.serviceNameContains) {
      where.push({
        field: "serviceName",
        op: "contains",
        value: filters.serviceNameContains,
      });
    }
    if (filters.hospitalName) {
      where.push({ field: "hospitalName", op: "eq", value: filters.hospitalName });
    }
    if (filters.state) {
      where.push({
        field: args.table === "procedures" ? "location.state" : "state",
        op: "eq",
        value: filters.state,
      });
    }
    if (filters.city) {
      where.push({
        field: args.table === "procedures" ? "location.city" : "city",
        op: "eq",
        value: filters.city,
      });
    }
    if (filters.insuranceProviderName) {
      where.push({
        field:
          args.table === "procedures"
            ? "insurance.providerName"
            : "insuranceProviderName",
        op: "eq",
        value: filters.insuranceProviderName,
      });
    }
    if (filters.insurancePlanName) {
      where.push({
        field:
          args.table === "procedures"
            ? "insurance.planName"
            : "insurancePlanName",
        op: "eq",
        value: filters.insurancePlanName,
      });
    }
    if (filters.dateOfProcedureGte !== undefined) {
      where.push({
        field: "dateOfProcedure",
        op: "gte",
        value: filters.dateOfProcedureGte,
      });
    }
    if (filters.dateOfProcedureLte !== undefined) {
      where.push({
        field: "dateOfProcedure",
        op: "lte",
        value: filters.dateOfProcedureLte,
      });
    }

    const candidates = await loadCandidateRows(ctx, {
      table: args.table,
      where,
      scanLimit: MAX_AGENT_SCAN_LIMIT,
    });
    const limit = normalizeLimit(args.limit, MAX_AGENT_READ_LIMIT, DEFAULT_QUERY_LIMIT);
    const rows = candidates.rows
      .filter((row) => rowMatches(args.table, row, where))
      .slice(0, limit);

    return {
      table: args.table,
      rows: await serializeRows(ctx, args.table, rows, []),
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

function metadataFields(
  table: AgentTable,
  key: "sortable" | "groupable" | "aggregatable",
) {
  return Object.entries(FIELD_METADATA[table])
    .filter(([, metadata]) => Boolean(metadata[key]))
    .map(([field]) => field);
}

function normalizeLimit(
  limit: number | undefined,
  max: number,
  defaultValue: number,
) {
  if (limit === undefined) return defaultValue;
  if (!Number.isFinite(limit)) return defaultValue;
  return Math.min(Math.max(Math.floor(limit), 1), max);
}

function normalizeCursor(cursor: number | undefined) {
  if (cursor === undefined || !Number.isFinite(cursor)) return 0;
  return Math.max(Math.floor(cursor), 0);
}

function validateQueryRequest(
  table: AgentTable,
  where: WhereCondition[],
  search: SearchRequest | undefined,
  sort: SortRequest | undefined,
  include: IncludeRequest[],
) {
  for (const condition of where) validateWhereCondition(table, condition);
  if (search) validateSearch(table, search);
  if (sort) validateFieldCapability(table, sort.field, "sortable");
  for (const relationship of include) validateRelationship(table, relationship);
}

function validateAggregateRequest(
  table: AgentTable,
  where: WhereCondition[],
  search: SearchRequest | undefined,
  groupBy: AgentField[],
  metrics: MetricRequest[],
) {
  for (const condition of where) validateWhereCondition(table, condition);
  if (search) validateSearch(table, search);
  for (const field of groupBy) validateFieldCapability(table, field, "groupable");
  for (const metric of metrics) {
    if (metric.op === "count") continue;
    if (!metric.field) {
      throw new Error(`Metric "${metric.op}" requires a field.`);
    }
    validateFieldCapability(table, metric.field, "aggregatable");
  }
}

function validateWhereCondition(table: AgentTable, condition: WhereCondition) {
  validateFieldCapability(table, condition.field, "filterable");
  const metadata = FIELD_METADATA[table][condition.field];
  if (!metadata?.operators?.includes(condition.op)) {
    throw new Error(
      `Operator "${condition.op}" is not supported for ${table}.${condition.field}.`,
    );
  }
  if (condition.op === "in" && !Array.isArray(condition.value)) {
    throw new Error(`Operator "in" requires an array value.`);
  }
  if (condition.op !== "in" && Array.isArray(condition.value)) {
    throw new Error(`Operator "${condition.op}" requires a scalar value.`);
  }
}

function validateFieldCapability(
  table: AgentTable,
  field: AgentField,
  capability: "filterable" | "searchable" | "sortable" | "groupable" | "aggregatable",
) {
  const metadata = FIELD_METADATA[table][field];
  if (!metadata || !metadata[capability]) {
    throw new Error(`Field "${field}" is not ${capability} on table "${table}".`);
  }
}

function validateSearch(table: AgentTable, search: SearchRequest) {
  validateFieldCapability(table, search.field, "searchable");
  if (!search.text.trim()) {
    throw new Error("Search text is required.");
  }
}

function validateRelationship(table: AgentTable, relationship: IncludeRequest) {
  if (table === "procedures" && relationship === "lineItems") return;
  if (table === "procedureLineItems" && relationship === "procedure") return;
  throw new Error(`Relationship "${relationship}" is not supported for "${table}".`);
}

async function loadCandidateRows(
  ctx: QueryCtx,
  args: {
    table: AgentTable;
    where: WhereCondition[];
    search?: SearchRequest;
    scanLimit: number;
  },
): Promise<{ rows: AgentRow[]; warnings: string[] }> {
  if (args.table === "procedures") {
    return {
      rows: await loadProcedureCandidates(ctx, args.where, args.search, args.scanLimit),
      warnings: [],
    };
  }
  return {
    rows: await loadLineItemCandidates(ctx, args.where, args.search, args.scanLimit),
    warnings: [],
  };
}

async function loadProcedureCandidates(
  ctx: QueryCtx,
  where: WhereCondition[],
  search: SearchRequest | undefined,
  limit: number,
) {
  if (search) {
    return await ctx.db
      .query("procedures")
      .withSearchIndex("search_description", (q) =>
        q.search("procedureDescription", search.text),
      )
      .take(limit);
  }

  const hospitalName = eqString(where, "hospitalName");
  const state = eqString(where, "location.state");
  const city = eqString(where, "location.city");
  const insuranceProviderName = eqString(where, "insurance.providerName");
  const insurancePlanName = eqString(where, "insurance.planName");

  if (hospitalName) {
    return await ctx.db
      .query("procedures")
      .withIndex("by_hospitalName_and_dateOfProcedure", (q) =>
        q.eq("hospitalName", hospitalName),
      )
      .take(limit);
  }
  if (state && city) {
    return await ctx.db
      .query("procedures")
      .withIndex("by_locationState_locationCity_date", (q) =>
        q.eq("location.state", state).eq("location.city", city),
      )
      .take(limit);
  }
  if (insuranceProviderName && insurancePlanName) {
    return await ctx.db
      .query("procedures")
      .withIndex("by_insuranceProvider_insurancePlan_date", (q) =>
        q
          .eq("insurance.providerName", insuranceProviderName)
          .eq("insurance.planName", insurancePlanName),
      )
      .take(limit);
  }
  return await ctx.db.query("procedures").take(limit);
}

async function loadLineItemCandidates(
  ctx: QueryCtx,
  where: WhereCondition[],
  search: SearchRequest | undefined,
  limit: number,
) {
  if (search?.field === "cptCode") {
    return await ctx.db
      .query("procedureLineItems")
      .withSearchIndex("search_cpt", (q) => q.search("cptCode", search.text))
      .take(limit);
  }
  if (search?.field === "serviceName") {
    return await ctx.db
      .query("procedureLineItems")
      .withSearchIndex("search_service", (q) =>
        q.search("serviceName", search.text),
      )
      .take(limit);
  }

  const procedureId = eqString(where, "procedureId") as Id<"procedures"> | undefined;
  const cptCode = eqString(where, "cptCode");
  const hospitalName = eqString(where, "hospitalName");
  const state = eqString(where, "state");
  const city = eqString(where, "city");
  const insuranceProviderName = eqString(where, "insuranceProviderName");
  const insurancePlanName = eqString(where, "insurancePlanName");

  if (procedureId) {
    return await ctx.db
      .query("procedureLineItems")
      .withIndex("by_procedureId", (q) => q.eq("procedureId", procedureId))
      .take(limit);
  }
  if (cptCode && hospitalName) {
    return await ctx.db
      .query("procedureLineItems")
      .withIndex("by_cptCode_hospitalName_date", (q) =>
        q.eq("cptCode", cptCode).eq("hospitalName", hospitalName),
      )
      .take(limit);
  }
  if (cptCode && state && city) {
    return await ctx.db
      .query("procedureLineItems")
      .withIndex("by_cptCode_state_city_date", (q) =>
        q.eq("cptCode", cptCode).eq("state", state).eq("city", city),
      )
      .take(limit);
  }
  if (cptCode && insuranceProviderName && insurancePlanName) {
    return await ctx.db
      .query("procedureLineItems")
      .withIndex("by_cptCode_insuranceProvider_insurancePlan_date", (q) =>
        q
          .eq("cptCode", cptCode)
          .eq("insuranceProviderName", insuranceProviderName)
          .eq("insurancePlanName", insurancePlanName),
      )
      .take(limit);
  }
  if (cptCode) {
    return await ctx.db
      .query("procedureLineItems")
      .withIndex("by_cptCode_and_procedureId", (q) => q.eq("cptCode", cptCode))
      .take(limit);
  }
  return await ctx.db.query("procedureLineItems").take(limit);
}

function eqString(where: WhereCondition[], field: AgentField) {
  const condition = where.find(
    (item) => item.field === field && item.op === "eq" && !Array.isArray(item.value),
  );
  return typeof condition?.value === "string" ? condition.value : undefined;
}

function rowMatches(table: AgentTable, row: AgentRow, where: WhereCondition[]) {
  return where.every((condition) => conditionMatches(table, row, condition));
}

function conditionMatches(
  table: AgentTable,
  row: AgentRow,
  condition: WhereCondition,
) {
  const actual = fieldValue(table, row, condition.field);
  if (condition.op === "in") {
    const values = Array.isArray(condition.value) ? condition.value : [];
    return values.some((value) => valuesEqual(actual, value));
  }
  if (Array.isArray(condition.value)) return false;
  if (condition.op === "eq") return valuesEqual(actual, condition.value);
  if (condition.op === "contains") {
    return (
      typeof actual === "string" &&
      typeof condition.value === "string" &&
      actual.toLowerCase().includes(condition.value.trim().toLowerCase())
    );
  }
  const actualNumber = numericValue(actual);
  const expectedNumber = numericValue(condition.value);
  if (actualNumber === null || expectedNumber === null) return false;
  if (condition.op === "gte") return actualNumber >= expectedNumber;
  if (condition.op === "lte") return actualNumber <= expectedNumber;
  return false;
}

function valuesEqual(actual: unknown, expected: string | number | bigint) {
  if (typeof actual === "string" && typeof expected === "string") {
    return actual.toLowerCase() === expected.toLowerCase();
  }
  const actualNumber = numericValue(actual);
  const expectedNumber = numericValue(expected);
  if (actualNumber !== null && expectedNumber !== null) {
    return actualNumber === expectedNumber;
  }
  return actual === expected;
}

function numericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  return null;
}

function sortRows(
  table: AgentTable,
  rows: AgentRow[],
  sort: SortRequest | undefined,
) {
  if (!sort) return rows;
  const direction = sort.direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const left = comparableValue(fieldValue(table, a, sort.field));
    const right = comparableValue(fieldValue(table, b, sort.field));
    if (left < right) return -1 * direction;
    if (left > right) return 1 * direction;
    return 0;
  });
}

function comparableValue(value: unknown) {
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return "";
}

async function serializeRows(
  ctx: QueryCtx,
  table: AgentTable,
  rows: AgentRow[],
  include: IncludeRequest[],
) {
  if (table === "procedures") {
    return await Promise.all(
      (rows as ProcedureRow[]).map(async (row) => {
        const serialized = serializeProcedure(row);
        if (include.includes("lineItems")) {
          const lineItems = await ctx.db
            .query("procedureLineItems")
            .withIndex("by_procedureId", (q) => q.eq("procedureId", row._id))
            .take(100);
          serialized.lineItems = lineItems.map(serializeLineItem);
        }
        return serialized;
      }),
    );
  }

  return await Promise.all(
    (rows as LineItemRow[]).map(async (row) => {
      const serialized = serializeLineItem(row);
      if (include.includes("procedure")) {
        const procedure = await ctx.db.get(row.procedureId);
        serialized.procedure = procedure ? serializeProcedure(procedure) : null;
      }
      return serialized;
    }),
  );
}

function aggregateRows(
  table: AgentTable,
  rows: AgentRow[],
  groupBy: AgentField[],
  metrics: MetricRequest[],
) {
  const groups = new Map<string, { group: Record<string, unknown>; rows: AgentRow[] }>();

  for (const row of rows) {
    const group = Object.fromEntries(
      groupBy.map((field) => [field, normalizeOutputValue(fieldValue(table, row, field))]),
    );
    const key = JSON.stringify(group);
    const existing = groups.get(key);
    if (existing) {
      existing.rows.push(row);
    } else {
      groups.set(key, { group, rows: [row] });
    }
  }

  return Array.from(groups.values())
    .map(({ group, rows: groupRows }) => ({
      group,
      metrics: Object.fromEntries(
        metrics.map((metric) => [
          metricKey(metric),
          computeMetric(table, groupRows, metric),
        ]),
      ),
    }))
    .sort((a, b) => {
      const bCount = Number(b.metrics.count ?? 0);
      const aCount = Number(a.metrics.count ?? 0);
      return bCount - aCount;
    });
}

function metricKey(metric: MetricRequest) {
  return metric.op === "count" ? "count" : `${metric.op}_${metric.field}`;
}

function computeMetric(table: AgentTable, rows: AgentRow[], metric: MetricRequest) {
  if (metric.op === "count") return rows.length;
  if (!metric.field) return null;

  const values = rows
    .map((row) => numericValue(fieldValue(table, row, metric.field!)))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  if (values.length === 0) return null;
  if (metric.op === "min") return values[0];
  if (metric.op === "max") return values[values.length - 1];
  if (metric.op === "sum") return values.reduce((sum, value) => sum + value, 0);
  if (metric.op === "avg") {
    return Math.round(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
  }
  return median(values);
}

function median(values: number[]) {
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) return values[middle];
  return Math.round((values[middle - 1] + values[middle]) / 2);
}

async function buildDiagnostics(
  ctx: QueryCtx,
  args: {
    table: AgentTable;
    where: WhereCondition[];
    search?: SearchRequest;
    candidateCount: number;
    filteredCount: number;
    returnedCount: number;
    scanLimit: number;
    warnings: string[];
  },
) {
  const suggestions =
    args.returnedCount === 0
      ? await buildFilterSuggestions(ctx, args.table)
      : {
          broadenByDropping: [],
          sampleValues: {},
        };

  return {
    appliedFilters: args.where,
    search: args.search ?? null,
    stageCounts: {
      candidates: args.candidateCount,
      afterFilters: args.filteredCount,
      returned: args.returnedCount,
    },
    scanLimit: args.scanLimit,
    warnings: [
      ...args.warnings,
      ...(args.candidateCount >= args.scanLimit
        ? [`Candidate rows reached the scan limit of ${args.scanLimit}.`]
        : []),
    ],
    noResultHelp:
      args.returnedCount === 0
        ? "No rows matched every requested condition. Broaden by dropping the most specific filters first, then retry with search or fewer location/insurance constraints."
        : null,
    suggestions,
  };
}

async function buildFilterSuggestions(ctx: QueryCtx, table: AgentTable) {
  if (table === "procedures") {
    const rows = await ctx.db.query("procedures").take(200);
    return {
      broadenByDropping: [
        "hospitalName",
        "location.city",
        "insurance.planName",
        "dateOfProcedure",
      ],
      sampleValues: {
        hospitalName: unique(rows.map((row) => row.hospitalName), 8),
        state: unique(rows.map((row) => row.location.state), 8),
        city: unique(rows.map((row) => row.location.city), 8),
        insuranceProviderName: unique(
          rows.map((row) => row.insurance.providerName),
          8,
        ),
        insurancePlanName: unique(rows.map((row) => row.insurance.planName), 8),
        procedureDescription: unique(
          rows.map((row) => row.procedureDescription),
          8,
        ),
      },
    };
  }

  const rows = await ctx.db.query("procedureLineItems").take(200);
  return {
    broadenByDropping: [
      "hospitalName",
      "city",
      "insurancePlanName",
      "dateOfProcedure",
    ],
    sampleValues: {
      cptCode: unique(rows.map((row) => row.cptCode), 8),
      serviceName: unique(rows.map((row) => row.serviceName ?? ""), 8),
      hospitalName: unique(rows.map((row) => row.hospitalName), 8),
      state: unique(rows.map((row) => row.state), 8),
      city: unique(rows.map((row) => row.city), 8),
      insuranceProviderName: unique(
        rows.map((row) => row.insuranceProviderName),
        8,
      ),
      insurancePlanName: unique(rows.map((row) => row.insurancePlanName), 8),
    },
  };
}

function unique(values: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    result.push(normalized);
    if (result.length >= limit) break;
  }
  return result;
}

function fieldValue(table: AgentTable, row: AgentRow, field: AgentField): unknown {
  if (table === "procedures") {
    const procedure = row as ProcedureRow;
    switch (field) {
      case "_id":
        return procedure._id;
      case "_creationTime":
        return procedure._creationTime;
      case "procedureDescription":
        return procedure.procedureDescription;
      case "dateOfProcedure":
        return procedure.dateOfProcedure;
      case "hospitalName":
        return procedure.hospitalName;
      case "location.city":
        return procedure.location.city;
      case "location.state":
        return procedure.location.state;
      case "insurance.providerName":
        return procedure.insurance.providerName;
      case "insurance.planName":
        return procedure.insurance.planName;
      case "billedAmount":
        return procedure.billedAmount;
      case "allowedAmount":
        return procedure.allowedAmount;
      default:
        return null;
    }
  }

  const lineItem = row as LineItemRow;
  switch (field) {
    case "_id":
      return lineItem._id;
    case "_creationTime":
      return lineItem._creationTime;
    case "procedureId":
      return lineItem.procedureId;
    case "cptCode":
      return lineItem.cptCode;
    case "serviceName":
      return lineItem.serviceName ?? null;
    case "units":
      return lineItem.units;
    case "costPerUnit":
      return lineItem.costPerUnit;
    case "lineTotal":
      return lineItem.units * lineItem.costPerUnit;
    case "providerName":
      return lineItem.providerName ?? null;
    case "hospitalName":
      return lineItem.hospitalName;
    case "city":
      return lineItem.city;
    case "state":
      return lineItem.state;
    case "insuranceProviderName":
      return lineItem.insuranceProviderName;
    case "insurancePlanName":
      return lineItem.insurancePlanName;
    case "dateOfProcedure":
      return lineItem.dateOfProcedure;
    default:
      return null;
  }
}

function serializeProcedure(row: ProcedureRow): SerializedRow {
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

function serializeLineItem(row: LineItemRow): SerializedRow {
  return {
    _id: row._id,
    _creationTime: row._creationTime,
    procedureId: row.procedureId,
    cptCode: row.cptCode,
    serviceName: row.serviceName ?? null,
    units: Number(row.units),
    costPerUnit: Number(row.costPerUnit),
    lineTotal: Number(row.units * row.costPerUnit),
    providerName: row.providerName ?? null,
    hospitalName: row.hospitalName,
    city: row.city,
    state: row.state,
    insuranceProviderName: row.insuranceProviderName,
    insurancePlanName: row.insurancePlanName,
    dateOfProcedure: Number(row.dateOfProcedure),
  };
}

function normalizeOutputValue(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  return value;
}
