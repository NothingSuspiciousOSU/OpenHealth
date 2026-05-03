import { QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { filter } from "convex-helpers/server/filter";

/**
 * Common filter type for procedure queries.
 */
export interface ProcedureFilters {
  insuranceProvider?: string;
  insurancePlan?: string;
  state?: string;
  city?: string;
  hospitalName?: string;
  afterDate?: bigint;
}

/**
 * Find procedures matching a CPT code by looking up line items.
 * Uses the `by_cptCode_and_procedureId` index for efficient lookup.
 */
export async function findProceduresByCpt(
  ctx: QueryCtx,
  { cptCode, limit = 500, filters }: { cptCode: string; limit?: number; filters?: ProcedureFilters },
): Promise<Doc<"procedures">[]> {
  let indexName: 
    | "by_cptCode_and_procedureId"
    | "by_cptCode_hospitalName_date"
    | "by_cptCode_insuranceProvider_insurancePlan_date"
    | "by_cptCode_state_city_date" = "by_cptCode_and_procedureId";
  
  if (filters?.hospitalName) {
    indexName = "by_cptCode_hospitalName_date";
  } else if (filters?.insuranceProvider) {
    indexName = "by_cptCode_insuranceProvider_insurancePlan_date";
  } else if (filters?.state) {
    indexName = "by_cptCode_state_city_date";
  }

  let lineItemsQuery = ctx.db
    .query("procedureLineItems")
    .withIndex(indexName, (q: any) => {
      let iq = q.eq("cptCode", cptCode);
      if (indexName === "by_cptCode_hospitalName_date") {
        iq = iq.eq("hospitalName", filters!.hospitalName);
      } else if (indexName === "by_cptCode_insuranceProvider_insurancePlan_date") {
        iq = iq.eq("insuranceProviderName", filters!.insuranceProvider);
        if (filters!.insurancePlan) {
          iq = iq.eq("insurancePlanName", filters!.insurancePlan);
        }
      } else if (indexName === "by_cptCode_state_city_date") {
        iq = iq.eq("state", filters!.state);
        if (filters!.city) {
          iq = iq.eq("city", filters!.city);
        }
      }
      return iq;
    });

  if (filters) {
    const conditions: Record<string, any> = {};
    const handledByProviderIndex = indexName === "by_cptCode_insuranceProvider_insurancePlan_date";
    const handledByStateIndex = indexName === "by_cptCode_state_city_date";
    const handledByHospitalIndex = indexName === "by_cptCode_hospitalName_date";

    if (!handledByProviderIndex && filters.insuranceProvider) conditions["insuranceProviderName"] = filters.insuranceProvider;
    if (!handledByProviderIndex && filters.insurancePlan) conditions["insurancePlanName"] = filters.insurancePlan;
    if (!handledByStateIndex && filters.state) conditions["state"] = filters.state;
    if (!handledByStateIndex && filters.city) conditions["city"] = filters.city;
    if (!handledByHospitalIndex && filters.hospitalName) conditions["hospitalName"] = filters.hospitalName;

    if (Object.keys(conditions).length > 0) {
      lineItemsQuery = filter(lineItemsQuery, conditions as any);
    }
    
    if (filters.afterDate !== undefined) {
      lineItemsQuery = lineItemsQuery.filter((q: any) => q.gte(q.field("dateOfProcedure"), filters.afterDate));
    }
  }

  const lineItems = await lineItemsQuery.take(limit * 5); // Take more to account for duplicates

  const uniqueIds = Array.from(new Set(lineItems.map((li) => li.procedureId)));
  const results: Doc<"procedures">[] = [];
  for (const pid of uniqueIds) {
    if (results.length >= limit) break;
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
  { text, limit = 2000, filters }: { text: string; limit?: number; filters?: ProcedureFilters },
): Promise<Doc<"procedures">[]> {
  
  let query;
  if (!text) {
    query = ctx.db.query("procedures");
  } else {
    query = ctx.db
      .query("procedures")
      .withSearchIndex("search_description", (q) => {
        let sq = q.search("procedureDescription", text);
        
        if (filters?.hospitalName) sq = sq.eq("hospitalName", filters.hospitalName);
        if (filters?.state) sq = sq.eq("location.state", filters.state);
        if (filters?.city) sq = sq.eq("location.city", filters.city);
        if (filters?.insuranceProvider) sq = sq.eq("insurance.providerName", filters.insuranceProvider);
        if (filters?.insurancePlan) sq = sq.eq("insurance.planName", filters.insurancePlan);

        return sq;
      });
  }

  if (filters) {
    const conditions: Record<string, any> = {};
    
    if (!text && filters.insuranceProvider) conditions["insurance.providerName"] = filters.insuranceProvider;
    if (!text && filters.insurancePlan) conditions["insurance.planName"] = filters.insurancePlan;
    if (!text && filters.state) conditions["location.state"] = filters.state;
    if (!text && filters.city) conditions["location.city"] = filters.city;
    if (!text && filters.hospitalName) conditions["hospitalName"] = filters.hospitalName;

    if (Object.keys(conditions).length > 0) {
      query = filter(query, conditions as any);
    }

    if (filters.afterDate !== undefined) {
      query = query.filter((q: any) => q.gte(q.field("dateOfProcedure"), filters.afterDate));
    }
  }

  return await query.take(limit);
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
