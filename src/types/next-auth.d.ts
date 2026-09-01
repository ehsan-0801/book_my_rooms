import type { DefaultSession } from "next-auth";

/**
 * Role is declared as a literal union rather than imported from the generated
 * Prisma client: this ambient file is loaded before the client is generated on
 * a clean checkout, and a missing import would silently widen the type.
 * It must stay in step with the `UserRole` enum in prisma/schema.prisma.
 */
type AppUserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppUserRole;
      /** Set only when the user's vendor account is APPROVED. */
      vendorId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AppUserRole;
    vendorId?: string | null;
  }
}

// `next-auth/jwt` only re-exports `@auth/core/jwt`, and declaration merging
// does not travel through a re-export — the JWT interface must be augmented
// on the module that actually declares it.
declare module "@auth/core/jwt" {
  interface JWT {
    role?: AppUserRole;
    vendorId?: string | null;
  }
}
