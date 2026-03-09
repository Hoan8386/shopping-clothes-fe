import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Route protection rules:
 *  - /login, /register       → redirect to "/" if already authenticated
 *  - /account /cart /checkout
 *    /orders  /reviews       → any authenticated user (USER / EMPLOYEE / ADMIN)
 *  - /staff/**               → EMPLOYEE or ADMIN
 *  - /admin/**               → EMPLOYEE or ADMIN  (consistent with original app)
 */

const AUTH_ONLY_ROUTES = ["/login", "/register"];

const USER_ROUTES = ["/account", "/cart", "/checkout", "/orders", "/reviews"];

// Staff panel — accessible by staff and admins
const STAFF_ROUTES = ["/staff"];

// Admin panel — accessible by admin only
const ADMIN_ROUTES = ["/admin"];

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  // --- already authenticated → leave auth pages ---
  if (AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r)) && session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // --- requires any login ---
  if (USER_ROUTES.some((r) => pathname.startsWith(r)) && !session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // --- staff routes: NHAN_VIEN or ADMIN ---
  if (STAFF_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    const role = session.user?.role?.name;
    if (role !== "ADMIN" && role !== "NHAN_VIEN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // --- admin routes: ADMIN only ---
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!session) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    const role = session.user?.role?.name;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next.js internals, static assets and API routes handled by NextAuth
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
