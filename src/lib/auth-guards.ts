import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/client";

/**
 * Server-side role gates. Middleware only checks that *a* session exists;
 * these enforce which role may see a given page (SRS §5.4) and are the real
 * boundary — a vendor must never reach another vendor's data.
 */

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

/** Returns the vendor id, guaranteeing the caller owns it. */
export async function requireVendor() {
  const user = await requireRole("VENDOR");
  if (!user.vendorId) redirect("/dashboard/pending");
  return { user, vendorId: user.vendorId };
}
