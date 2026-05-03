import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

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

export async function describeConvexDataModel() {
  return getConvexClient().query(api.agent.describeDataModel, {
    token: getAgentReadToken(),
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
