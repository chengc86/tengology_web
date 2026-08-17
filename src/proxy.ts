import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic route protection.
 *
 * This only checks whether a session cookie is present, so an unauthenticated
 * visitor is bounced to sign-in without a database round trip on every request.
 * It is deliberately NOT the authorization boundary — the admin layout and each
 * server action re-check the real session and role, which is what actually
 * protects the data.
 */

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.has(name));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (hasSessionCookie(request)) return NextResponse.next();

  const signIn = new URL("/auth/signin", request.url);
  signIn.searchParams.set("callbackUrl", `${pathname}${search}`);

  return NextResponse.redirect(signIn);
}

export const config = {
  // Guest order tracking lives at /orders/*, so it stays open deliberately.
  matcher: ["/account/:path*", "/admin/:path*"],
};
