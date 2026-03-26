import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Jib l-Invoices
export const getInvoices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("invoices").order("desc").collect();
  },
});

// Zid Invoice Jdida
export const addInvoice = mutation({
  args: {
    invoiceNo: v.optional(v.string()),
    country: v.optional(v.string()),
    clientName: v.string(), // Kheliha hakka (hna f l-cas dyalna Ayman)
    amount: v.number(),
    status: v.string(),
    date: v.string(),
    type: v.string(),
    paidAt: v.optional(v.number()),
    details: v.any(), // 🪄 S-S7er: Hna ghan-khebiyou ga3 l-m3lomat dyal l-7ssab w leads!
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("invoices", args);
  },
});

// Beddel Invoice
export const updateInvoice = mutation({
  args: {
    id: v.id("invoices"),
    amount: v.number(),
    details: v.any(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Rddha "Paid"
export const markAsPaid = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      status: 'Paid',
      paidAt: Date.now()
    });
  },
});

// Msse7 Invoice
export const deleteInvoice = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});