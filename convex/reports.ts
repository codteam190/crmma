import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// JIB L-AD SPENDS M3A L-PRODUIT DYALHOM
export const getDailySpends = query({
  args: {},
  handler: async (ctx) => {
    const spends = await ctx.db.query("dailyAdSpends").order("desc").collect();
    
    return await Promise.all(
      spends.map(async (spend) => {
        const product = await ctx.db.get(spend.productId);
        return {
          ...spend,
          product: product || null,
        };
      })
    );
  },
});

// ZID AD SPEND JDID
export const addDailySpend = mutation({
  args: {
    date: v.string(),
    productId: v.id("products"),
    advertiser: v.string(),
    spend: v.number(),
    leads: v.number(),
    maxCost: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dailyAdSpends", args);
  },
});

// MSSE7 AD SPEND
export const deleteDailySpend = mutation({
  args: { id: v.id("dailyAdSpends") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});