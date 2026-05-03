import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  AgentAggregateDataRequest,
  AgentQueryDataRequest,
  AgentWhereCondition,
} from "@/lib/shared/chat/agentRead";

let convexClient: ConvexHttpClient | null = null;

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
  }

  if (!convexClient) {
    convexClient = new ConvexHttpClient(url);
  }

  return convexClient;
}

function getAgentReadToken() {
  const token = process.env.AGENT_READ_TOKEN;
  if (!token) {
    throw new Error("AGENT_READ_TOKEN environment variable is required");
  }
  return token;
}

export type AgentReadFilters = {
  procedureId?: string;
  cptCode?: string;
  procedureDescriptionContains?: string;
  serviceNameContains?: string;
  hospitalName?: string;
  state?: string;
  city?: string;
  insuranceProviderName?: string;
  insurancePlanName?: string;
  dateOfProcedureGte?: number;
  dateOfProcedureLte?: number;
};

const INT64_FIELDS = new Set([
  "dateOfProcedure",
  "billedAmount",
  "allowedAmount",
  "units",
  "costPerUnit",
  "lineTotal",
]);

function normalizeFilters(filters: AgentReadFilters | undefined) {
  if (!filters) return undefined;

  return {
    ...filters,
    procedureId: filters.procedureId as Id<"procedures"> | undefined,
    dateOfProcedureGte:
      filters.dateOfProcedureGte === undefined
        ? undefined
        : BigInt(filters.dateOfProcedureGte),
    dateOfProcedureLte:
      filters.dateOfProcedureLte === undefined
        ? undefined
        : BigInt(filters.dateOfProcedureLte),
  };
}

function normalizeDslWhere(where: AgentWhereCondition[] | undefined) {
  if (!where) return undefined;
  return where.map((condition) => ({
    ...condition,
    value: Array.isArray(condition.value)
      ? condition.value.map((value) => normalizeDslValue(condition.field, value))
      : normalizeDslValue(condition.field, condition.value),
  }));
}

function normalizeDslValue(field: string, value: string | number) {
  if (typeof value === "number" && INT64_FIELDS.has(field)) {
    return BigInt(value);
  }
  return value;
}

export async function describeConvexDataModel() {
  return getConvexClient().query(api.agent.describeDataModel, {
    token: getAgentReadToken(),
  });
}

export async function queryConvexAgentData(request: AgentQueryDataRequest) {
  return getConvexClient().query(api.agent.queryData, {
    token: getAgentReadToken(),
    ...request,
    where: normalizeDslWhere(request.where),
  });
}

export async function aggregateConvexAgentData(
  request: AgentAggregateDataRequest,
) {
  return getConvexClient().query(api.agent.aggregateData, {
    token: getAgentReadToken(),
    ...request,
    where: normalizeDslWhere(request.where),
  });
}

export async function readConvexAgentData({
  table,
  limit,
  filters,
}: {
  table: "procedures" | "procedureLineItems";
  limit?: number;
  filters?: AgentReadFilters;
}) {
  return getConvexClient().query(api.agent.readData, {
    token: getAgentReadToken(),
    table,
    limit,
    filters: normalizeFilters(filters),
  });
}
