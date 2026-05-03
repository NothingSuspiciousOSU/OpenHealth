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

export const agentQueryDataRequestSchema = z.object({
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

export const agentAggregateDataRequestSchema = z.object({
  table: agentTableSchema,
  where: z.array(agentWhereConditionSchema).max(12).optional(),
  search: agentSearchSchema.optional(),
  groupBy: z.array(agentFieldSchema).min(1).max(3).optional(),
  metrics: z.array(agentMetricSchema).min(1).max(8).optional(),
  limit: z.number().int().min(1).max(MAX_AGENT_GROUPS).optional(),
});

export const agentReadRequestSchema = z.object({
  table: agentTableSchema,
  limit: z.number().int().min(1).max(MAX_AGENT_READ_LIMIT).optional(),
  where: z.array(agentWhereConditionSchema).max(12).optional(),
  search: agentSearchSchema.optional(),
  sort: agentSortSchema.optional(),
  include: z.array(agentIncludeSchema).max(2).optional(),
  cursor: z.number().int().min(0).optional(),
});

export type AgentReadRequest = z.infer<typeof agentReadRequestSchema>;
export type AgentQueryDataRequest = z.infer<typeof agentQueryDataRequestSchema>;
export type AgentAggregateDataRequest = z.infer<typeof agentAggregateDataRequestSchema>;
export type AgentWhereCondition = z.infer<typeof agentWhereConditionSchema>;

export function normalizeAgentReadLimit(limit: number | undefined) {
  if (limit === undefined || !Number.isFinite(limit)) return 25;
  return Math.min(Math.max(Math.floor(limit), 1), MAX_AGENT_READ_LIMIT);
}
