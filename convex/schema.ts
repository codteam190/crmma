import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.string(),
    accessPages: v.string(),
    status: v.optional(v.string()), 
  }).index("by_email", ["email"]),

  products: defineTable({
    name: v.string(),
    sku: v.string(),
    country: v.string(),
    image: v.optional(v.string()),
    url: v.optional(v.string()),
  }).index("by_sku", ["sku"]),

  leads: defineTable({
    fullName: v.string(),
    phone: v.string(),
    country: v.optional(v.string()), 
    quantity: v.number(),
    price: v.number(),
    status: v.string(),
    productId: v.id("products"),
    updatedAt: v.optional(v.number()), 
    url: v.optional(v.string()),
  }),

  leadHistory: defineTable({
    leadId: v.id("leads"),
    status: v.string(),
  }),

  sourcings: defineTable({
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
  }),

  // ✅ QADINA REPORTS (ZdnA advertiser, leads, maxCost, note)
  dailyAdSpends: defineTable({
    productId: v.id("products"),
    date: v.string(),
    advertiser: v.string(),
    spend: v.number(),
    leads: v.number(),
    maxCost: v.number(),
    note: v.optional(v.string()),
  }),

  monthlyExpenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.any(), 
    month: v.optional(v.string()),
  }),

  // ✅ QADINA INVOICES (Zdna details: v.any() w l-fields jdad)
  invoices: defineTable({
    invoiceNo: v.optional(v.string()),
    country: v.optional(v.string()),
    clientName: v.string(),
    amount: v.number(),
    status: v.string(),
    date: v.string(),
    type: v.string(),
    paidAt: v.optional(v.number()),
    details: v.any(), // 🪄 Hna fin m-khebbya rwina dyal l-7ssab w l-montajat
  }),
}, { schemaValidation: false });