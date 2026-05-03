const { ConvexHttpClient } = require("convex/browser");
require("dotenv").config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function wipeAndSeed() {
  console.log("Wiping...");
  let rem = -1;
  while (rem !== 0) {
    const res = await client.mutation("mockData:clearBatch");
    rem = res.remaining;
    process.stdout.write(`Remaining chunk sizes: ${rem}\r`);
  }
  console.log("\nWiped. Seeding...");
  await client.mutation("mockData:generate");
  console.log("Seeded!");
}
wipeAndSeed();
