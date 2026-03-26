import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Kan-jib l-URL dyal Convex mn l-Environment Variables
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const phoneNumber = String(data.phone || '').trim();
    if (!phoneNumber) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 });
    }

    // N-siftou d-Data l-Mutation lli qaddina f Convex
    const result = await convex.mutation(api.leads.addLeadFromWebhook, {
      sku: data.sku ? String(data.sku).trim() : undefined,
      phone: phoneNumber,
      fullName: String(data.fullName || 'Unknown'),
      country: String(data.country || 'LB'),
      quantity: parseInt(data.quantity) || 1,
      price: parseFloat(data.price) || 0,
      url: data.url ? String(data.url) : undefined,
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Error saving lead", 
      error: error.message 
    }, { status: 500 });
  }
}