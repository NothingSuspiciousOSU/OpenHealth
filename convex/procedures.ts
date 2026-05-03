import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const create = mutation({
  args: {
    procedure: v.object({
      procedureDescription: v.string(),
      dateOfProcedure: v.int64(),
      hospitalName: v.string(),
      location: v.object({
        city: v.string(),
        state: v.string(),
      }),
      insurance: v.object({
        providerName: v.string(),
        planName: v.string(),
      }),
      billedAmount: v.int64(),
      allowedAmount: v.int64(),
    }),
    procedureLineItems: v.array(
      v.object({
        cptCode: v.string(),
        serviceName: v.union(v.string(), v.null()),
        units: v.int64(),
        costPerUnit: v.int64(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const procedureId = await ctx.db.insert("procedures", args.procedure);

    for (const lineItem of args.procedureLineItems) {
      await ctx.db.insert("procedureLineItems", {
        procedureId,
        cptCode: lineItem.cptCode,
        serviceName: lineItem.serviceName ?? undefined,
        units: lineItem.units,
        costPerUnit: lineItem.costPerUnit,
        hospitalName: args.procedure.hospitalName,
        city: args.procedure.location.city,
        state: args.procedure.location.state,
        insuranceProviderName: args.procedure.insurance.providerName,
        insurancePlanName: args.procedure.insurance.planName,
        dateOfProcedure: args.procedure.dateOfProcedure,
      });
    }

    return { procedureId };
  },
});
