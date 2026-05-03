const { ConvexHttpClient } = require("convex/browser");
require("dotenv").config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function checkData() {
  const procedures = await client.query("search:getFilterOptions");
  console.log("Unique Procedures in Filter Options:");
  console.log("Insurances:", Object.keys(procedures.insurances).length);
  console.log("Providers:", procedures.providers.length);
  console.log("Locations:", Object.keys(procedures.locations).length);
  
  const trending = await client.query("search:getTrendingProcedures");
  console.log("\nTrending count:", trending.length);
  console.log(trending);
}
checkData().catch(console.error);
