import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  findProceduresByCpt,
  findProceduresByDescription,
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
    limit: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    profileProvider: v.optional(v.string()),
    profilePlan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Match procedures by CPT code or text description
    const isCptCode = /^\d{5}$/.test(args.q.trim());
    const limit = args.limit ?? 500; // Fetch up to 500 to sort
    const filters = {
      insuranceProvider: args.insuranceProvider,
      insurancePlan: args.insurancePlan,
      state: args.state,
      city: args.city,
      hospitalName: args.hospitalName,
      afterDate: args.afterDate,
    };

    const filtered = isCptCode
      ? await findProceduresByCpt(ctx, { cptCode: args.q.trim(), limit, filters })
      : await findProceduresByDescription(ctx, { text: args.q, limit, filters });

    // Sort before limiting
    if (args.sortBy === "price_asc") {
      filtered.sort((a, b) => Number(a.allowedAmount) - Number(b.allowedAmount));
    } else if (args.sortBy === "price_desc") {
      filtered.sort((a, b) => Number(b.allowedAmount) - Number(a.allowedAmount));
    } else if (args.profileProvider) {
      filtered.sort((a, b) => {
        const aMatches = a.insurance.providerName === args.profileProvider && a.insurance.planName === args.profilePlan;
        const bMatches = b.insurance.providerName === args.profileProvider && b.insurance.planName === args.profilePlan;
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    return filtered;
  },
});

export const searchStats = query({
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
    // Highly cached query to return raw procedure stats for the graphs (no CPT code fetching overhead)
    const isCptCode = /^\d{5}$/.test(args.q.trim());
    const limit = 500;
    const filters = {
      insuranceProvider: args.insuranceProvider,
      insurancePlan: args.insurancePlan,
      state: args.state,
      city: args.city,
      hospitalName: args.hospitalName,
      afterDate: args.afterDate,
    };

    const filtered = isCptCode
      ? await findProceduresByCpt(ctx, { cptCode: args.q.trim(), limit, filters })
      : await findProceduresByDescription(ctx, { text: args.q, limit, filters });

    return filtered;
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
    // Search a large sample of the database for filter options
    const procedures = await ctx.db.query("procedures").take(500);
    const lineItems = await ctx.db.query("procedureLineItems").take(500);

    const insurances: Record<string, Set<string>> = {};
    const locations: Record<string, Record<string, Set<string>>> = {};
    const providers = new Set<string>();

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

    for (const li of lineItems) {
      if (li.providerName) {
        providers.add(li.providerName);
      }
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
      providers: Array.from(providers),
    };
  },
});

export const getSuggestions = query({
  args: {
    q: v.string(),
  },
  handler: async (ctx, args) => {
    const q = args.q.trim().toLowerCase();
    if (!q) return { procedures: [], cptCodes: [] };

    // Procedure description suggestions using Convex Search Index
    const matchedProcs = await ctx.db
      .query("procedures")
      .withSearchIndex("search_description", (qIdx) =>
        qIdx.search("procedureDescription", q),
      )
      .take(100);

    const seenDescs = new Set<string>();
    const procedureSuggestions: string[] = [];
    for (const p of matchedProcs) {
      if (!seenDescs.has(p.procedureDescription)) {
        seenDescs.add(p.procedureDescription);
        procedureSuggestions.push(p.procedureDescription);
        if (procedureSuggestions.length >= 6) break;
      }
    }

    // CPT code & Service name suggestions using Convex Search Index
    const matchedLines = /^\d+$/.test(q)
      ? await ctx.db
        .query("procedureLineItems")
        .withSearchIndex("search_cpt", (qIdx) => qIdx.search("cptCode", q))
        .take(100)
      : await ctx.db
        .query("procedureLineItems")
        .withSearchIndex("search_service", (qIdx) =>
          qIdx.search("serviceName", q),
        )
        .take(100);

    const seenCpts = new Set<string>();
    const cptSuggestions: { code: string; name: string }[] = [];
    for (const li of matchedLines) {
      if (!seenCpts.has(li.cptCode)) {
        seenCpts.add(li.cptCode);
        cptSuggestions.push({
          code: li.cptCode,
          name: li.serviceName || li.cptCode,
        });
        if (cptSuggestions.length >= 4) break;
      }
    }

    return { procedures: procedureSuggestions, cptCodes: cptSuggestions };
  },
});

export const getTrendingProcedures = query({
  args: {},
  handler: async (ctx) => {
    const procedures = await ctx.db.query("procedures").take(500);

    const grouped: Record<
      string,
      { count: number; totalCost: number }
    > = {};

    for (const p of procedures) {
      const desc = p.procedureDescription;
      if (!grouped[desc]) grouped[desc] = { count: 0, totalCost: 0 };
      grouped[desc].count += 1;
      grouped[desc].totalCost += Number(p.allowedAmount);
    }

    const trending = Object.entries(grouped)
      .map(([description, data]) => ({
        description,
        count: data.count,
        avgCost: Math.round(data.totalCost / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return trending;
  },
});

