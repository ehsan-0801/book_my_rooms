import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type Role = "CUSTOMER" | "VENDOR" | "ADMIN";

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "You don't have permission to do that") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorisedError extends Error {
  status = 401;
  constructor(message = "You need to be signed in") {
    super(message);
    this.name = "UnauthorisedError";
  }
}

export interface Actor {
  id: string;
  role: Role;
  vendorId: string | null;
}

/**
 * Single source of truth for "who is calling and may they do this".
 *
 * Both server actions and route handlers go through here, so authorisation
 * can't drift between the two. Middleware only proves a session exists — it
 * never authorises an operation.
 */
export async function getActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    vendorId: session.user.vendorId ?? null,
  };
}

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new UnauthorisedError();
  return actor;
}

export async function requireRoles(...roles: Role[]): Promise<Actor> {
  const actor = await requireActor();
  if (!roles.includes(actor.role)) throw new ForbiddenError();
  return actor;
}

export async function requireAdminActor(): Promise<Actor> {
  return requireRoles("ADMIN");
}

/** An approved vendor. Pending vendors are rejected — they can't list yet. */
export async function requireVendorActor(): Promise<Actor & { vendorId: string }> {
  const actor = await requireRoles("VENDOR");
  if (!actor.vendorId) {
    throw new ForbiddenError("Your vendor account is still awaiting approval");
  }
  return actor as Actor & { vendorId: string };
}

/** Admin or the owning vendor. Returns the actor plus an ownership scope. */
export async function requireAdminOrVendor(): Promise<
  Actor & { scopeVendorId: string | null }
> {
  const actor = await requireRoles("ADMIN", "VENDOR");
  if (actor.role === "VENDOR" && !actor.vendorId) {
    throw new ForbiddenError("Your vendor account is still awaiting approval");
  }
  return {
    ...actor,
    // null means "no restriction" (admin); a vendor is pinned to their own id.
    scopeVendorId: actor.role === "ADMIN" ? null : actor.vendorId,
  };
}

/* ------------------------------------------------------- ownership checks */

/** Throws unless the actor may write to this property. */
export async function assertPropertyAccess(actor: Actor, propertyId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      ...(actor.role === "ADMIN" ? {} : { vendorId: actor.vendorId ?? "__none__" }),
    },
    select: { id: true, vendorId: true, slug: true },
  });
  if (!property) throw new ForbiddenError();
  return property;
}

export async function assertRoomAccess(actor: Actor, roomId: string) {
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      ...(actor.role === "ADMIN"
        ? {}
        : { property: { vendorId: actor.vendorId ?? "__none__" } }),
    },
    select: { id: true, propertyId: true, property: { select: { slug: true } } },
  });
  if (!room) throw new ForbiddenError();
  return room;
}

export async function assertBookingAccess(actor: Actor, bookingId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      ...(actor.role === "ADMIN"
        ? {}
        : actor.role === "VENDOR"
          ? { property: { vendorId: actor.vendorId ?? "__none__" } }
          : { userId: actor.id }),
    },
    select: {
      id: true, userId: true, status: true, paymentStatus: true,
      grandTotal: true, propertyId: true,
    },
  });
  if (!booking) throw new ForbiddenError();
  return booking;
}

/** Writes an audit trail row for financial and administrative operations. */
export async function recordAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  after?: unknown,
) {
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      entityType,
      entityId,
      after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)),
    },
  });
}
