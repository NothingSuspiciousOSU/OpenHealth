import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  findProceduresByCpt,
  findProceduresByDescription,
  applyProcedureFilters,
  attachCptCodes,
} from "./model/procedures";

export const searchProcedures = query({
  args: {
    q: v.string(),
    insuranceProvider: v.optional(v.string()),
    insurancePlan: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    hospitalName: v.optional(v.string()),
    afterDate: v.optional(v.int64()),
  },
  handler: async (ctx, args) => {
    // 1. Match procedures by CPT code or text description
    const isCptCode = /^\d{5}$/.test(args.q.trim());

    const matched = isCptCode
      ? await findProceduresByCpt(ctx, { cptCode: args.q.trim() })
      : await findProceduresByDescription(ctx, { text: args.q });

    // 2. Apply filters in-memory
    const filtered = applyProcedureFilters(matched, {
      insuranceProvider: args.insuranceProvider,
      insurancePlan: args.insurancePlan,
      state: args.state,
      city: args.city,
      hospitalName: args.hospitalName,
      afterDate: args.afterDate,
    });

    // 3. Limit results to keep reads bounded
    const limited = filtered.slice(0, 50);

    // 4. Attach CPT codes
    return attachCptCodes(ctx, limited);
  },
});

export const getLineItems = query({
  args: {
    procedureId: v.id("procedures"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("procedureLineItems")
      .withIndex("by_procedureId", (q) =>
        q.eq("procedureId", args.procedureId),
      )
      .take(100);
  },
});

export const getFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    // Use .take() to bound reads — 500 procedures is enough for filter options
    const procedures = await ctx.db.query("procedures").take(500);

    const insurances: Record<string, Set<string>> = {};
    const locations: Record<string, Record<string, Set<string>>> = {};

    for (const p of procedures) {
      // Insurance
      const prov = p.insurance.providerName;
      const plan = p.insurance.planName;
      if (!insurances[prov]) insurances[prov] = new Set();
      if (plan) insurances[prov].add(plan);

      // Location
      const state = p.location.state;
      const city = p.location.city;
      const hosp = p.hospitalName;

      if (!locations[state]) locations[state] = {};
      if (!locations[state][city]) locations[state][city] = new Set();
      if (hosp) locations[state][city].add(hosp);
    }

    // Convert to serializable format
    const serializedInsurances: Record<string, string[]> = {};
    for (const prov in insurances) {
      serializedInsurances[prov] = Array.from(insurances[prov]);
    }

    const serializedLocations: Record<string, Record<string, string[]>> = {};
    for (const state in locations) {
      serializedLocations[state] = {};
      for (const city in locations[state]) {
        serializedLocations[state][city] = Array.from(locations[state][city]);
      }
    }

    return {
      insurances: serializedInsurances,
      locations: serializedLocations,
    };
  },
});
