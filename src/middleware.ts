import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/** Everything behind the shared /dashboard namespace requires a session. */
const PROTECTED = ["/dashboard"];
/** Signed-in users have no reason to see these. */
const AUTH_PAGES = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const path = nextUrl.pathname;

  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(path);

  if (isProtected && !session) {
    const url = new URL("/login", nextUrl);
    // Bounce back to the requested page after signing in.
    url.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Skip static assets and the auth API itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|images|favicon.ico).*)"],
};
