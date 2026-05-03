import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const removeProcedureEmbeddings = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all procedureEmbeddings docs to clear the unused database
    const embeddings = await ctx.db.query("procedureEmbeddings" as any).collect();
    for (const doc of embeddings) {
      await ctx.db.delete(doc._id);
    }
  },
});
