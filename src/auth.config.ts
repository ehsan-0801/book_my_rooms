import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the Auth.js config.
 *
 * Middleware runs on the edge runtime, where Prisma and bcrypt can't load, so
 * this file holds only what the matcher needs: page routes, session shape and
 * the token/session callbacks. The credentials provider and Prisma adapter are
 * added in `src/auth.ts`, which only ever runs in Node.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    // Required by the credentials provider — it can't use database sessions.
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.vendorId = user.vendorId ?? null;
      }
      // Lets a vendor's approval flow through without re-login.
      if (trigger === "update" && session?.vendorId !== undefined) {
        token.vendorId = session.vendorId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role ?? "CUSTOMER";
        session.user.vendorId = token.vendorId ?? null;
      }
      return session;
    },
  },
  providers: [], // filled in by src/auth.ts
} satisfies NextAuthConfig;
