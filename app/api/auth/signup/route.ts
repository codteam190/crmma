import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Kan-jib l-URL dyal Convex mn l-Environment Variables
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Bghina l'm3lomat kamlin!" }, { status: 400 });
    }

    // 1. N-khebbiw (Hash) l'mot de passe bach may-banch f Database
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. N-creyiw l'kheddam f Database dyal Convex
    try {
      const newUserId = await convex.mutation(api.users.addUser, {
        name: name,
        email: email,
        password: hashedPassword,
        role: "ADMIN", // 👑 L'kheddam l-wl li ghat-creyi, ghay-koun ADMIN par defaut
        accessPages: "all",
        status: "Active"
      });

      return NextResponse.json({ message: "T-sjjlti b naja7!", userId: newUserId }, { status: 201 });
      
    } catch (convexError: any) {
      // 🚨 L-Mutation dyalna (addUser) f Convex k-t-lo7 Error ila lqat l-email kayn
      if (convexError.message.includes("m-st3mel deja") || convexError.message.includes("already exists")) {
        return NextResponse.json({ message: "Had l'email deja m-sajjel!" }, { status: 400 });
      }
      throw convexError; // Ila kan chi error akhor
    }

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ message: "W9e3 mochkil f server" }, { status: 500 });
  }
}