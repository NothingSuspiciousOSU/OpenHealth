import { mutation } from "./_generated/server";
import {
  generatedHospitals,
  generatedInsurances,
  generatedProviders,
  generatedProceduresData,
} from "./mockDataSets";
import { prestoredData } from "./prestoredData";

/**
 * Delete a batch of data from both tables.
 * Call repeatedly until `remaining` is 0.
 */
export const clearBatch = mutation({
  args: {},
  handler: async (ctx) => {
    const procedures = await ctx.db.query("procedures").take(200);
    for (const p of procedures) await ctx.db.delete("procedures", p._id);

    const lineItems = await ctx.db.query("procedureLineItems").take(200);
    for (const li of lineItems)
      await ctx.db.delete("procedureLineItems", li._id);

    return { remaining: procedures.length + lineItems.length };
  },
});

/**
 * Generate 500 synthetic procedures with associated line items.
 */
export const generate = mutation({
  args: {},
  handler: async (ctx) => {
    const hospitals = generatedHospitals;
    const insurances = generatedInsurances;
    const providers = generatedProviders;
    const proceduresData = generatedProceduresData;

    for (let i = 0; i < 1000; i++) {
      const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
      const insurance =
        insurances[Math.floor(Math.random() * insurances.length)];
      const procTemplate =
        proceduresData[Math.floor(Math.random() * proceduresData.length)];

      const baseCost = procTemplate.cpts.reduce(
        (acc, curr) => acc + curr.cost,
        0,
      );
      const noise = Math.random() * 0.4 - 0.2; // +/- 20%
      const billedDollars = BigInt(Math.floor((baseCost * (1 + noise)) / 100));
      const allowedDollars = BigInt(
        Math.floor(Number(billedDollars) * (0.4 + Math.random() * 0.3)),
      ); // 40-70% allowed

      const dateOfProcedure = BigInt(
        Date.now() - Math.floor(Math.random() * 10000000000),
      ); // Past ~115 days

      const procedureId = await ctx.db.insert("procedures", {
        procedureDescription: procTemplate.desc,
        dateOfProcedure,
        hospitalName: hospital.name,
        location: {
          city: hospital.city,
          state: hospital.state,
        },
        insurance: {
          providerName: insurance.provider,
          planName: insurance.plan,
        },
        billedAmount: billedDollars,
        allowedAmount: allowedDollars,
      });

      for (const cpt of procTemplate.cpts) {
        const cptDollars = BigInt(Math.floor((cpt.cost * (1 + noise)) / 100));
        const providerName =
          providers[Math.floor(Math.random() * providers.length)];

        await ctx.db.insert("procedureLineItems", {
          procedureId,
          cptCode: cpt.code,
          serviceName: cpt.name,
          units: BigInt(1),
          costPerUnit: cptDollars,
          providerName,
          hospitalName: hospital.name,
          city: hospital.city,
          state: hospital.state,
          insuranceProviderName: insurance.provider,
          insurancePlanName: insurance.plan,
          dateOfProcedure,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Load realistic prestored data from prestoredData.ts
 */
export const loadPrestored = mutation({
  args: {},
  handler: async (ctx) => {
    for (const entry of prestoredData) {
      const dateOfProcedure = BigInt(entry.dateOfProcedure);
      const billedAmount = BigInt(entry.billedAmount);
      const allowedAmount = BigInt(entry.allowedAmount);

      const procedureId = await ctx.db.insert("procedures", {
        procedureDescription: entry.procedureDescription,
        dateOfProcedure,
        hospitalName: entry.hospitalName,
        location: {
          city: entry.city,
          state: entry.state,
        },
        insurance: {
          providerName: entry.insuranceProvider,
          planName: entry.insurancePlan,
        },
        billedAmount,
        allowedAmount,
      });

      for (const item of entry.lineItems) {
        await ctx.db.insert("procedureLineItems", {
          procedureId,
          cptCode: item.cptCode,
          serviceName: item.serviceName,
          units: BigInt(item.units),
          costPerUnit: BigInt(item.costPerUnit),
          providerName: item.providerName,
          hospitalName: entry.hospitalName,
          city: entry.city,
          state: entry.state,
          insuranceProviderName: entry.insuranceProvider,
          insurancePlanName: entry.insurancePlan,
          dateOfProcedure,
        });
      }
    }
    return { success: true };
  },
});
