import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Jib ga3 l-Agents
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("desc").collect();
  },
});

// Zid Agent jdid
export const addUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.string(),
    accessPages: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // N-t2ekdou blli had l-email baqi mat-st3melch
    const existing = await ctx.db.query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("Hada l-Email m-st3mel deja!");
    }

    return await ctx.db.insert("users", args);
  },
});

// Beddel s-Salahiyat (Access) wla s-Status
export const updateUserAccess = mutation({
  args: {
    id: v.id("users"),
    accessPages: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Msse7 Agent
export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});