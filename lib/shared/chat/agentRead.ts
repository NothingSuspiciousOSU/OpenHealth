import { z } from "zod";

export const MAX_AGENT_READ_LIMIT = 100;

export const agentReadFiltersSchema = z.object({
  procedureId: z.string().optional(),
  cptCode: z.string().optional(),
  procedureDescriptionContains: z.string().optional(),
  serviceNameContains: z.string().optional(),
  hospitalName: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  insuranceProviderName: z.string().optional(),
  insurancePlanName: z.string().optional(),
  dateOfProcedureGte: z.number().int().optional(),
  dateOfProcedureLte: z.number().int().optional(),
});

export const agentReadRequestSchema = z.object({
  table: z.enum(["procedures", "procedureLineItems"]),
  limit: z.number().int().min(1).max(MAX_AGENT_READ_LIMIT).optional(),
  filters: agentReadFiltersSchema.optional(),
});

export type AgentReadRequest = z.infer<typeof agentReadRequestSchema>;

export function normalizeAgentReadLimit(limit: number | undefined) {
  if (limit === undefined || !Number.isFinite(limit)) return 25;
  return Math.min(Math.max(Math.floor(limit), 1), MAX_AGENT_READ_LIMIT);
}
