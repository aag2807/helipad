import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_SECRET = process.env.AUTH_SECRET || "helipad-booking-secret-key-change-in-production";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token using next-auth/jwt
  const token = await getToken({ 
    req: request, 
    secret: AUTH_SECRET,
  });
  
  const isLoggedIn = !!token;
  const isAdmin = token?.role === "admin";

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes require admin role
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/bookings/calendar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/bookings/:path*",
    "/profile/:path*",
  ],
};

