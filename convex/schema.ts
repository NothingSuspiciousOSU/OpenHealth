import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),

  procedures: defineTable({
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

    billedAmountCents: v.int64(),
    allowedAmountCents: v.int64(),
  })
    .index("by_dateOfProcedure", ["dateOfProcedure"])
    .index("by_hospitalName_and_dateOfProcedure", [
      "hospitalName",
      "dateOfProcedure",
    ])
    .index("by_locationState_locationCity_date", [
      "location.state",
      "location.city",
      "dateOfProcedure",
    ])
    .index("by_insuranceProvider_insurancePlan_date", [
      "insurance.providerName",
      "insurance.planName",
      "dateOfProcedure",
    ]),

  procedureLineItems: defineTable({
    procedureId: v.id("procedures"),
    cptCode: v.string(),
    serviceName: v.optional(v.string()),
    units: v.int64(),
    costPerUnitCents: v.int64(),

    hospitalName: v.string(),
    city: v.string(),
    state: v.string(),
    insuranceProviderName: v.string(),
    insurancePlanName: v.string(),
    dateOfProcedure: v.int64(),
  })
    .index("by_procedureId", ["procedureId"])
    .index("by_cptCode", ["cptCode"])
    .index("by_cptCode_and_procedureId", ["cptCode", "procedureId"])
    .index("by_cptCode_hospitalName_date", [
      "cptCode",
      "hospitalName",
      "dateOfProcedure",
    ])
    .index("by_cptCode_state_city_date", [
      "cptCode",
      "state",
      "city",
      "dateOfProcedure",
    ])
    .index("by_cptCode_insuranceProvider_insurancePlan_date", [
      "cptCode",
      "insuranceProviderName",
      "insurancePlanName",
      "dateOfProcedure",
    ]),

});
