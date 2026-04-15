import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";

// Kan-jib l-URL dyal Convex mn l-Environment Variables
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Khassk t-dkhel Email w Password!");
        }

        try {
          // 1. Jib l-Agents kamlin mn Convex w qelleb 3la moul had l-email
          const users = await convex.query(api.users.getUsers);
          const user = users.find((u: any) => u.email === credentials.email);

          if (!user) {
            throw new Error("Had l-Email ma-kaynch f l-CRM!");
          }

          // 2. T2ekked mn s-Status (Wach mbanni wla la)
          if (user.status === "Suspended") {
            throw new Error("L-Compte dyalk m-bloki. Dwi m3a l-Admin.");
          }

         // 3. 9aren l-mot de passe (L-Mokh l-jdid)
          let isValid = false;

          // Wach l-mot de passe m-crypté (bhal dyal l-admin l-qdim) wla 3adi (yallah t-zad)
          if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
            isValid = await bcrypt.compare(credentials.password, user.password);
          } else {
            // Ila kan 3adi (Plain text)
            isValid = credentials.password === user.password;
          }

          if (!isValid) {
            throw new Error("Mot de passe ghalat!");
          }

          // 4. Ila kolchi nady, rje3 l-m3lomat dyal l-user l-NextAuth
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            accessPages: user.accessPages,
          };

        } catch (error: any) {
          throw new Error(error.message || "W9e3 mochkil f login!");
        }
      }
    })
  ],
  pages: {
    signIn: "/login", // S-sf7a dyal login dyalk
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.accessPages = user.accessPages;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).accessPages = token.accessPages;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET || "crm-leads-bounty-secret-key-2026-super-secure",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };