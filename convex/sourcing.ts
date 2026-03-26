import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// JIB SOURCINGS
export const getSourcings = query({
  args: {},
  handler: async (ctx) => {
    const sourcings = await ctx.db.query("sourcings").order("desc").collect();
    // N-jibou smiyat l-produits m3ahom
    return await Promise.all(
      sourcings.map(async (sourcing) => {
        const product = await ctx.db.get(sourcing.productId);
        return {
          ...sourcing,
          productName: product?.name || "Unknown Product",
          productSku: product?.sku || "N/A",
        };
      })
    );
  },
});

// ZID SOURCING JDID
export const addSourcing = mutation({
  args: {
    productId: v.id("products"),
    productLink: v.optional(v.string()),
    supplier: v.string(),
    paymentStatus: v.string(),
    paymentMethod: v.optional(v.string()),
    sourcingCountry: v.string(),
    destination: v.string(),
    shippingMethod: v.string(),
    shippingCompany: v.optional(v.string()), // ✅ ZIDNA HADI
    trackingNumber: v.optional(v.string()),  // ✅ ZIDNA HADI
    quantity: v.number(),
    qtyReceived: v.optional(v.number()),     // ✅ ZIDNA HADI
    costPrice: v.number(),
    amount: v.number(),
    weight: v.optional(v.number()),          // ✅ ZIDNA HADI
    status: v.string(),
    orderDate: v.number(),
    shippedDate: v.optional(v.number()),     // ✅ ZIDNA HADI
    receivedDate: v.optional(v.number()),    // ✅ ZIDNA HADI
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sourcings", args);
  },
});

// BEDDEL STATUS (UPDATE PARTIAL)
export const updateSourcingStatus = mutation({
  args: {
    id: v.id("sourcings"),
    status: v.string(),
    qtyReceived: v.optional(v.number()),
    receivedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
// BEDDEL GA3 L-M3LOMAT DYAL SOURCING (FULL UPDATE)
export const updateSourcing = mutation({
  args: {
    id: v.id("sourcings"),
    productId: v.id("products"),
    productLink: v.optional(v.string()),
    supplier: v.string(),
    paymentStatus: v.string(),
    paymentMethod: v.optional(v.string()),
    sourcingCountry: v.string(),
    destination: v.string(),
    shippingMethod: v.string(),
    shippingCompany: v.optional(v.string()), 
    trackingNumber: v.optional(v.string()),  
    quantity: v.number(),
    qtyReceived: v.optional(v.number()),     
    costPrice: v.number(),
    amount: v.number(),
    weight: v.optional(v.number()),          
    status: v.string(),
    orderDate: v.number(),
    shippedDate: v.optional(v.number()),     
    receivedDate: v.optional(v.number()),    
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});