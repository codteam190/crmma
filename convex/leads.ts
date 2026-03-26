import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


// JIB HISTORY DYAL GA3 L-LEADS
export const getLeadHistory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("leadHistory").collect();
  },
});

// ==========================================
// 1. NJIBOU GA3 L-LEADS (L-Qraya)
// ==========================================
export const getLeads = query({
  args: {},
  handler: async (ctx) => {
    // Kan-jibouhom w kan-rtbouhom mn j-jdid l-qdim
    return await ctx.db.query("leads").order("desc").collect();
  },
});

// ==========================================
// 2. N-CREYIW MBI3A JDIDA (Manual Order)
// ==========================================
export const createManualOrder = mutation({
  args: {
    productId: v.id("products"),
    fullName: v.string(),
    phone: v.string(),
    country: v.optional(v.string()),
    quantity: v.number(),
    price: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Njibo l'produit mn Database bach n-hezzo mnno l'URL
    const product = await ctx.db.get(args.productId);

    // 2. N-creyiw l'mbi3a w n-rbtoha m3a l'produit
    const newLeadId = await ctx.db.insert("leads", {
      fullName: args.fullName,
      phone: args.phone,
      country: args.country,
      quantity: args.quantity,
      price: args.price,
      status: args.status,
      productId: args.productId,
      url: product?.url, // Hezzina l-URL mn l-Product
      updatedAt: Date.now(),
    });

    // 3. (Bonus) N-ssjjlo l-bdya dyalha f l-History
    await ctx.db.insert("leadHistory", {
      leadId: newLeadId,
      status: args.status,
    });

    return newLeadId;
  },
});

// ==========================================
// 3. N-BEDDLOU STATUS DYAL L-MBI3A
// ==========================================
export const updateLeadStatus = mutation({
  args: {
    id: v.id("leads"),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Beddel l'Status f l'mbi3a (patch = update partial)
    await ctx.db.patch(args.id, { 
      status: args.newStatus,
      updatedAt: Date.now(),
    });
    
    // 2. Sajjel chno w9e3 f l'History
    await ctx.db.insert("leadHistory", {
      leadId: args.id,
      status: args.newStatus,
    });
  },
});

// ==========================================
// 4. L-MODAL DYAL UPSELL & EDIT
// ==========================================
export const updateLead = mutation({
  args: {
    id: v.id("leads"),
    fullName: v.string(),
    phone: v.string(),
    country: v.optional(v.string()),
    status: v.string(),
    quantity: v.number(),
    price: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Njibo l-Lead l-9dima bach n-choufou wach s-Status t-bdel
    const existingLead = await ctx.db.get(args.id);
    if (!existingLead) throw new Error("Lead not found");

    // 2. N-bdlou GHIR l-m3lomat li mssmou7 liha t-bdel
    await ctx.db.patch(args.id, {
      fullName: args.fullName,
      phone: args.phone,
      country: args.country,
      status: args.status,
      quantity: args.quantity, 
      price: args.price, 
      updatedAt: Date.now(),
    });

    // 3. Ila l-Agent bdel s-Status mn wsst l-Modal dyal l'Edit, n-ssjjloha f History
    if (existingLead.status !== args.status) {
      await ctx.db.insert("leadHistory", {
        leadId: args.id,
        status: args.status,
      });
    }
  },
});
// ================= WEBHOOK: ZID LEAD MN GOOGLE SHEETS =================
export const addLeadFromWebhook = mutation({
  args: {
    sku: v.optional(v.string()),
    phone: v.string(),
    fullName: v.string(),
    country: v.optional(v.string()),
    quantity: v.number(),
    price: v.number(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let productId = null;
    let finalUrl = args.url;

    // 1. N-9ellbo 3la l'Produit b l'SKU
    if (args.sku) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_sku", (q) => q.eq("sku", args.sku!))
        .first();

      if (product) {
        productId = product._id;
        if (!finalUrl) finalUrl = product.url;
      }
    }

    // 🚨 MOULAHADA: F Schema jdida, productId darouri!
    if (!productId) {
      throw new Error(`Product with SKU "${args.sku}" not found in CRM! Create it first.`);
    }

    // 2. L-RADAR DYAL DUPLICATES 🚨
    const existingLead = await ctx.db
      .query("leads")
      .filter((q) => 
         q.and(
           q.eq(q.field("phone"), args.phone),
           q.eq(q.field("productId"), productId)
         )
      )
      .first();

    if (existingLead) {
      // Ila lqah, kay-rje3 Success bach Google Sheet y-t-henna (✅ Synced)
      return { success: true, message: "Duplicate ignored", isDuplicate: true };
    }

    // 3. N-sjjlo l'Lead f Database (Ila daret mn l-Radar)
    const newLeadId = await ctx.db.insert("leads", {
      fullName: args.fullName || 'Unknown',
      phone: args.phone,
      country: args.country || 'LB',
      quantity: args.quantity || 1,
      price: args.price || 0,
      status: 'New',
      url: finalUrl,
      productId: productId,
      updatedAt: Date.now(),
    });

    // N-zidouha 7tta f l-History
    await ctx.db.insert("leadHistory", {
      leadId: newLeadId,
      status: 'New',
    });

    return { success: true, leadId: newLeadId, isDuplicate: false };
  },
});