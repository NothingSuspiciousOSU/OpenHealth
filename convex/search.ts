import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";

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
    // 1. Determine if it's a CPT code (digits only) or text
    let matchedProcedureIds: Id<"procedures">[] = [];
    
    // For this mockup, if query has 5 digits, we'll treat it as a CPT code
    const isCptCode = /^\d{5}$/.test(args.q.trim());
    
    if (isCptCode) {
      const lineItems = await ctx.db
        .query("procedureLineItems")
        .withIndex("by_cptCode", (q) => q.eq("cptCode", args.q.trim()))
        .collect();
      matchedProcedureIds = Array.from(new Set(lineItems.map(li => li.procedureId)));
    } else {
      // Mock semantic search: just find procedures whose description contains the text (case insensitive)
      // (Since we don't have embeddings set up)
      const allProcedures = await ctx.db.query("procedures").collect();
      const qLower = args.q.toLowerCase();
      // Also return all if q is empty
      matchedProcedureIds = allProcedures
        .filter(p => !args.q || p.procedureDescription.toLowerCase().includes(qLower))
        .map(p => p._id);
    }
    
    // 2. Fetch the procedures
    let results: Doc<"procedures">[] = [];
    for (const pid of matchedProcedureIds) {
      const proc = await ctx.db.get(pid);
      if (proc) {
        results.push(proc);
      }
    }
    
    // 3. Apply filters
    if (args.insuranceProvider && args.insuranceProvider !== "") {
      results = results.filter(p => p.insurance.providerName === args.insuranceProvider);
    }
    if (args.insurancePlan && args.insurancePlan !== "") {
      results = results.filter(p => p.insurance.planName === args.insurancePlan);
    }
    if (args.state && args.state !== "") {
      results = results.filter(p => p.location.state === args.state);
    }
    if (args.city && args.city !== "") {
      results = results.filter(p => p.location.city === args.city);
    }
    if (args.hospitalName && args.hospitalName !== "") {
      results = results.filter(p => p.hospitalName === args.hospitalName);
    }
    if (args.afterDate) {
      results = results.filter(p => p.dateOfProcedure >= args.afterDate!);
    }
    
    // 4. Attach CPT Codes
    const resultsWithCpt = await Promise.all(
      results.map(async (p) => {
        const lineItems = await ctx.db
          .query("procedureLineItems")
          .withIndex("by_procedureId", (q) => q.eq("procedureId", p._id))
          .collect();
        const cptCodes = Array.from(new Set(lineItems.map((li) => li.cptCode)));
        return { ...p, cptCodes };
      })
    );
    
    return resultsWithCpt;
  }
});

export const getLineItems = query({
  args: {
    procedureId: v.id("procedures"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("procedureLineItems")
      .withIndex("by_procedureId", (q) => q.eq("procedureId", args.procedureId))
      .collect();
  }
});

export const getFilterOptions = query({
  args: {},
  handler: async (ctx) => {
    const procedures = await ctx.db.query("procedures").collect();
    
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
  }
});
