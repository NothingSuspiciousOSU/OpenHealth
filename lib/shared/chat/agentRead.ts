import { z } from "zod";

export const MAX_AGENT_READ_LIMIT = 100;
export const MAX_AGENT_SCAN_LIMIT = 500;
export const MAX_AGENT_GROUPS = 25;

const scalarValueSchema = z.union([z.string(), z.number().int()]);

export const agentTableSchema = z.enum(["procedures", "procedureLineItems"]);

export const agentProcedureFieldSchema = z.enum([
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
]);

export const agentLineItemFieldSchema = z.enum([
  "_id",
  "_creationTime",
  "procedureId",
  "cptCode",
  "serviceName",
  "units",
  "costPerUnit",
  "lineTotal",
  "providerName",
  "hospitalName",
  "city",
  "state",
  "insuranceProviderName",
  "insurancePlanName",
  "dateOfProcedure",
]);

export const agentFieldSchema = z.union([
  agentProcedureFieldSchema,
  agentLineItemFieldSchema,
]);

export const agentSearchSchema = z.object({
  field: z.enum(["procedureDescription", "cptCode", "serviceName"]),
  text: z.string().min(1),
});

export const agentWhereConditionSchema = z.object({
  field: agentFieldSchema,
  op: z.enum(["eq", "contains", "gte", "lte", "in"]),
  value: z.union([scalarValueSchema, z.array(scalarValueSchema).min(1).max(25)]),
}).superRefine((condition, ctx) => {
  const isArrayValue = Array.isArray(condition.value);
  if (condition.op === "in" && !isArrayValue) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: 'Operator "in" requires an array value.',
    });
  }
  if (condition.op !== "in" && isArrayValue) {
    ctx.addIssue({
      code: "custom",
      path: ["value"],
      message: `Operator "${condition.op}" requires a scalar value.`,
    });
  }
});

export const agentSortSchema = z.object({
  field: agentFieldSchema,
  direction: z.enum(["asc", "desc"]).optional(),
});

export const agentIncludeSchema = z.enum(["procedure", "lineItems"]);

const agentQueryDataRequestBaseSchema = z.object({
  table: agentTableSchema,
  where: z.array(agentWhereConditionSchema).max(12).optional(),
  search: agentSearchSchema.optional(),
  sort: agentSortSchema.optional(),
  include: z.array(agentIncludeSchema).max(2).optional(),
  limit: z.number().int().min(1).max(MAX_AGENT_READ_LIMIT).optional(),
  cursor: z.number().int().min(0).optional(),
});

export const agentMetricSchema = z.object({
  op: z.enum(["count", "min", "max", "avg", "median", "sum"]),
  field: agentFieldSchema.optional(),
});

const agentAggregateDataRequestBaseSchema = z.object({
  table: agentTableSchema,
  where: z.array(agentWhereConditionSchema).max(12).optional(),
  search: agentSearchSchema.optional(),
  groupBy: z.array(agentFieldSchema).min(1).max(3).optional(),
  metrics: z.array(agentMetricSchema).min(1).max(8).optional(),
  limit: z.number().int().min(1).max(MAX_AGENT_GROUPS).optional(),
});

const agentReadRequestBaseSchema = z.object({
  table: agentTableSchema,
  limit: z.number().int().min(1).max(MAX_AGENT_READ_LIMIT).optional(),
  where: z.array(agentWhereConditionSchema).max(12).optional(),
  search: agentSearchSchema.optional(),
  sort: agentSortSchema.optional(),
  include: z.array(agentIncludeSchema).max(2).optional(),
  cursor: z.number().int().min(0).optional(),
});

export const agentQueryDataRequestSchema =
  agentQueryDataRequestBaseSchema.superRefine(validateQueryDataRequest);

export const agentAggregateDataRequestSchema =
  agentAggregateDataRequestBaseSchema.superRefine(validateAggregateDataRequest);

export const agentReadRequestSchema =
  agentReadRequestBaseSchema.superRefine(validateQueryDataRequest);

export type AgentReadRequest = z.infer<typeof agentReadRequestSchema>;
export type AgentQueryDataRequest = z.infer<typeof agentQueryDataRequestSchema>;
export type AgentAggregateDataRequest = z.infer<typeof agentAggregateDataRequestSchema>;
export type AgentWhereCondition = z.infer<typeof agentWhereConditionSchema>;

export function normalizeAgentReadLimit(limit: number | undefined) {
  if (limit === undefined || !Number.isFinite(limit)) return 25;
  return Math.min(Math.max(Math.floor(limit), 1), MAX_AGENT_READ_LIMIT);
}

type QueryDataRequestBase = z.infer<typeof agentQueryDataRequestBaseSchema>;
type AggregateDataRequestBase = z.infer<typeof agentAggregateDataRequestBaseSchema>;

type AgentTable = z.infer<typeof agentTableSchema>;

type TableCapabilities = {
  fields: Set<string>;
  searchable: Set<string>;
  sortable: Set<string>;
  groupable: Set<string>;
  aggregatable: Set<string>;
  includes: Set<string>;
};

const tableCapabilities: Record<AgentTable, TableCapabilities> = {
  procedures: {
    fields: new Set(agentProcedureFieldSchema.options),
    searchable: new Set(["procedureDescription"]),
    sortable: new Set([
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
    ]),
    groupable: new Set([
      "procedureDescription",
      "dateOfProcedure",
      "hospitalName",
      "location.city",
      "location.state",
      "insurance.providerName",
      "insurance.planName",
    ]),
    aggregatable: new Set(["billedAmount", "allowedAmount"]),
    includes: new Set(["lineItems"]),
  },
  procedureLineItems: {
    fields: new Set(agentLineItemFieldSchema.options),
    searchable: new Set(["cptCode", "serviceName"]),
    sortable: new Set([
      "_creationTime",
      "cptCode",
      "serviceName",
      "units",
      "costPerUnit",
      "lineTotal",
      "providerName",
      "hospitalName",
      "city",
      "state",
      "insuranceProviderName",
      "insurancePlanName",
      "dateOfProcedure",
    ]),
    groupable: new Set([
      "procedureId",
      "cptCode",
      "serviceName",
      "providerName",
      "hospitalName",
      "city",
      "state",
      "insuranceProviderName",
      "insurancePlanName",
      "dateOfProcedure",
    ]),
    aggregatable: new Set(["units", "costPerUnit", "lineTotal"]),
    includes: new Set(["procedure"]),
  },
};

function validateQueryDataRequest(
  request: QueryDataRequestBase,
  ctx: z.RefinementCtx,
) {
  request.where?.forEach((condition, index) => {
    validateFieldForTable(ctx, request.table, condition.field, [
      "where",
      index,
      "field",
    ]);
  });

  if (request.search) {
    validateCapability(ctx, request.table, request.search.field, "searchable", [
      "search",
      "field",
    ]);
  }

  if (request.sort) {
    validateCapability(ctx, request.table, request.sort.field, "sortable", [
      "sort",
      "field",
    ]);
  }

  request.include?.forEach((relationship, index) => {
    if (!tableCapabilities[request.table].includes.has(relationship)) {
      ctx.addIssue({
        code: "custom",
        path: ["include", index],
        message: `Relationship "${relationship}" is not supported for table "${request.table}".`,
      });
    }
  });
}

function validateAggregateDataRequest(
  request: AggregateDataRequestBase,
  ctx: z.RefinementCtx,
) {
  request.where?.forEach((condition, index) => {
    validateFieldForTable(ctx, request.table, condition.field, [
      "where",
      index,
      "field",
    ]);
  });

  if (request.search) {
    validateCapability(ctx, request.table, request.search.field, "searchable", [
      "search",
      "field",
    ]);
  }

  request.groupBy?.forEach((field, index) => {
    validateCapability(ctx, request.table, field, "groupable", [
      "groupBy",
      index,
    ]);
  });

  request.metrics?.forEach((metric, index) => {
    if (metric.op === "count") return;

    if (!metric.field) {
      ctx.addIssue({
        code: "custom",
        path: ["metrics", index, "field"],
        message: `Metric "${metric.op}" requires a field.`,
      });
      return;
    }

    validateCapability(ctx, request.table, metric.field, "aggregatable", [
      "metrics",
      index,
      "field",
    ]);
  });
}

function validateFieldForTable(
  ctx: z.RefinementCtx,
  table: AgentTable,
  field: z.infer<typeof agentFieldSchema>,
  path: Array<string | number>,
) {
  if (tableCapabilities[table].fields.has(field)) return;

  ctx.addIssue({
    code: "custom",
    path,
    message: `Field "${field}" is not available on table "${table}".`,
  });
}

function validateCapability(
  ctx: z.RefinementCtx,
  table: AgentTable,
  field: z.infer<typeof agentFieldSchema>,
  capability: "searchable" | "sortable" | "groupable" | "aggregatable",
  path: Array<string | number>,
) {
  if (tableCapabilities[table][capability].has(field)) return;

  ctx.addIssue({
    code: "custom",
    path,
    message: `Field "${field}" is not ${capability} on table "${table}".`,
  });
}
