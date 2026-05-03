import { QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Find procedures matching a CPT code by looking up line items.
 * Uses the `by_cptCode_and_procedureId` index for efficient lookup.
 */
export async function findProceduresByCpt(
  ctx: QueryCtx,
  { cptCode }: { cptCode: string },
): Promise<Doc<"procedures">[]> {
  const lineItems = await ctx.db
    .query("procedureLineItems")
    .withIndex("by_cptCode_and_procedureId", (q) => q.eq("cptCode", cptCode))
    .take(200);

  const uniqueIds = Array.from(new Set(lineItems.map((li) => li.procedureId)));
  const results: Doc<"procedures">[] = [];
  for (const pid of uniqueIds) {
    const proc = await ctx.db.get("procedures", pid);
    if (proc) results.push(proc);
  }
  return results;
}

/**
 * Find procedures matching a text description (case-insensitive substring match).
 * Returns at most `limit` results.
 */
export async function findProceduresByDescription(
  ctx: QueryCtx,
  { text, limit = 200 }: { text: string; limit?: number },
): Promise<Doc<"procedures">[]> {
  const allProcedures = await ctx.db.query("procedures").take(limit);
  if (!text) return allProcedures;

  const qLower = text.toLowerCase();
  return allProcedures.filter((p) =>
    p.procedureDescription.toLowerCase().includes(qLower),
  );
}

/**
 * Apply optional filters to a list of procedures (in-memory).
 */
export function applyProcedureFilters(
  procedures: Doc<"procedures">[],
  filters: {
    insuranceProvider?: string;
    insurancePlan?: string;
    state?: string;
    city?: string;
    hospitalName?: string;
    afterDate?: bigint;
  },
): Doc<"procedures">[] {
  let results = procedures;

  if (filters.insuranceProvider) {
    results = results.filter(
      (p) => p.insurance.providerName === filters.insuranceProvider,
    );
  }
  if (filters.insurancePlan) {
    results = results.filter(
      (p) => p.insurance.planName === filters.insurancePlan,
    );
  }
  if (filters.state) {
    results = results.filter((p) => p.location.state === filters.state);
  }
  if (filters.city) {
    results = results.filter((p) => p.location.city === filters.city);
  }
  if (filters.hospitalName) {
    results = results.filter((p) => p.hospitalName === filters.hospitalName);
  }
  if (filters.afterDate !== undefined) {
    results = results.filter((p) => p.dateOfProcedure >= filters.afterDate!);
  }

  return results;
}

/**
 * Attach CPT codes to a list of procedures by looking up their line items.
 */
export async function attachCptCodes(
  ctx: QueryCtx,
  procedures: Doc<"procedures">[],
): Promise<(Doc<"procedures"> & { cptCodes: string[] })[]> {
  return Promise.all(
    procedures.map(async (p) => {
      const lineItems = await ctx.db
        .query("procedureLineItems")
        .withIndex("by_procedureId", (q) => q.eq("procedureId", p._id))
        .take(50);
      const cptCodes = Array.from(new Set(lineItems.map((li) => li.cptCode)));
      return { ...p, cptCodes };
    }),
  );
}
