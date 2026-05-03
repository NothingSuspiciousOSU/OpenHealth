import { internalMutation } from "./_generated/server";

/**
 * Delete a batch of data from both tables.
 * Call repeatedly until `remaining` is 0.
 */
export const clearBatch = internalMutation({
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
export const generate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const hospitals = [
      { name: "General Hospital", city: "New York", state: "NY" },
      { name: "Mercy Clinic", city: "Los Angeles", state: "CA" },
      { name: "St. Jude's", city: "Chicago", state: "IL" },
      { name: "City Health", city: "Austin", state: "TX" },
      { name: "Mount Sinai", city: "Miami", state: "FL" },
    ];

    const insurances = [
      { provider: "Blue Cross", plan: "PPO Silver" },
      { provider: "Aetna", plan: "HMO Basic" },
      { provider: "Cigna", plan: "High Deductible" },
      { provider: "UnitedHealthcare", plan: "Choice Plus" },
    ];

    const providers = [
      "Dr. Sarah Smith",
      "Dr. John Doe",
      "Quest Diagnostics",
      "LabCorp",
      "City Imaging Services",
      "Dr. Emily Chen",
      "Advanced Pathology Labs",
    ];

    const proceduresData = [
      {
        desc: "ACL Reconstruction Surgery",
        cpts: [
          {
            code: "29888",
            name: "Arthroscopically aided anterior cruciate ligament repair",
            cost: 500000,
          },
          { code: "00100", name: "Anesthesia", cost: 100000 },
        ],
      },
      {
        desc: "Appendectomy",
        cpts: [
          { code: "44970", name: "Laparoscopic Appendectomy", cost: 1200000 },
          { code: "99214", name: "Office Visit", cost: 15000 },
        ],
      },
      {
        desc: "Normal Pregnancy Delivery",
        cpts: [
          {
            code: "59400",
            name: "Routine obstetric care including antepartum care",
            cost: 800000,
          },
        ],
      },
      {
        desc: "Knee Replacement",
        cpts: [
          { code: "27447", name: "Total Knee Arthroplasty", cost: 3500000 },
          { code: "73200", name: "CT Scan", cost: 150000 },
        ],
      },
      {
        desc: "Cataract Surgery",
        cpts: [
          { code: "66984", name: "Extracapsular cataract removal", cost: 300000 },
        ],
      },
      {
        desc: "MRI of Brain",
        cpts: [{ code: "70551", name: "MRI Brain w/o dye", cost: 85000 }],
      },
      {
        desc: "Colonoscopy",
        cpts: [
          { code: "45378", name: "Diagnostic Colonoscopy", cost: 250000 },
          { code: "88305", name: "Pathology", cost: 25000 },
        ],
      },
      {
        desc: "Comprehensive Metabolic Panel",
        cpts: [{ code: "80053", name: "Metabolic panel", cost: 5000 }],
      },
    ];

    for (let i = 0; i < 500; i++) {
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
