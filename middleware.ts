import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. Ila kant path machi f dashboard, khllih y-douz
    if (!path.startsWith("/dashboard")) {
      return NextResponse.next();
    }

    // 2. L-Admin kay-dkhel l-kolchi
    if (token?.role === "ADMIN") {
      return NextResponse.next();
    }

    // 3. L-Agent: n-choufou l-Permissions
    if (token?.role === "AGENT") {
      const accessPages = (token?.accessPages as string) || "";
      const allowedPages = accessPages.split(",");

      // 🚨 FIX: Ila dkhel l-Dashboard nichan (/dashboard awla /dashboard/)
      if (path === "/dashboard" || path === "/dashboard/") {
        if (allowedPages.includes("dashboard")) {
          return NextResponse.next(); // Mrehba bik f Dashboard!
        } else {
          // Ma3ndouch l-7eq f Dashboard, n-rddouh l-awel page 3ndo
          const fallback = allowedPages.length > 0 && allowedPages[0] ? allowedPages[0] : "leads";
          return NextResponse.redirect(new URL(`/dashboard/${fallback}`, req.url));
        }
      }

      // 🚨 FIX: Ila dkhel l-Pages lokhrin (matalan /dashboard/leads)
      const pageName = path.split("/")[2]; 
      if (pageName && !allowedPages.includes(pageName)) {
        // Ma3ndouch l-7eq, jri 3lih!
        const fallback = allowedPages.length > 0 && allowedPages[0] ? allowedPages[0] : "leads";
        const redirectUrl = fallback === "dashboard" ? "/dashboard" : `/dashboard/${fallback}`;
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};