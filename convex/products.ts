import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==========================================
// 1. JIB GA3 L-PRODUITS (Catalog)
// ==========================================
export const getProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").order("desc").collect();
  },
});

// ==========================================
// 2. ZID PRODUIT JDID
// ==========================================
export const addProduct = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    country: v.string(),
    url: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 🚨 L-QFEL: N-qellbou wach l-SKU deja kayn f d-Database
    const existingProduct = await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("sku"), args.sku))
      .first();

    // Ila lqah kayn, ghay-red Error w ma-ghay-sajjalch!
    if (existingProduct) {
      throw new Error(`Had l-SKU '${args.sku}' deja m-sajjel! Koul Produit khasso SKU unique.`);
    }

    // Ila kan unique, ghay-sajjel 3adi
    return await ctx.db.insert("products", args);
  },
});

// ==========================================
// 3. BEDDEL L-M3LOMAT DYAL PRODUIT
// ==========================================
export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    country: v.string(),
    url: v.optional(v.string()),
    image: v.optional(v.string()), 
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      country: args.country,
      url: args.url,
    });
  },
});

// ==========================================
// 4. MSSE7 PRODUIT
// ==========================================
export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});