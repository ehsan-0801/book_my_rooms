"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fail, guard, ok, warn, type ActionResult } from "./result";

async function assertUser() {
  const session = await auth();
  if (!session?.user) throw new Error("You need to be signed in");
  return session.user;
}

export async function toggleWishlist(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const user = await assertUser();
    const propertyId = String(formData.get("propertyId") ?? "");
    if (!propertyId) return fail("Missing property");

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_propertyId: { userId: user.id, propertyId } },
      select: { id: true },
    });

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { name: true },
    });
    if (!property) return fail("That property no longer exists");

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
    } else {
      await prisma.wishlistItem.create({ data: { userId: user.id, propertyId } });
    }

    revalidatePath("/dashboard/wishlist");
    return ok(
      existing
        ? `${property.name} removed from your wishlist`
        : `${property.name} saved to your wishlist`,
    );
  });
}

export async function requestCancellation(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const user = await assertUser();
    const parsed = z
      .object({ id: z.string().min(1), reason: z.string().max(500).optional() })
      .safeParse({ id: formData.get("id"), reason: formData.get("reason") ?? undefined });
    if (!parsed.success) return fail("Invalid request");

    // Scope to the caller's own booking — never trust the id alone.
    const booking = await prisma.booking.findFirst({
      where: {
        id: parsed.data.id,
        userId: user.id,
        status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED"] },
      },
      select: { id: true, reference: true, grandTotal: true, paymentStatus: true },
    });
    if (!booking) return warn("That booking can no longer be cancelled");

    const wasPaid = booking.paymentStatus === "PAID";

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: wasPaid ? "REFUND_PENDING" : "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: parsed.data.reason ?? "Cancelled by guest",
        },
      }),
      prisma.commission.updateMany({
        where: { bookingId: booking.id },
        data: { status: "REVERSED", reversedAt: new Date() },
      }),
      // A paid booking needs a refund record for the finance queue (SRS §28).
      ...(wasPaid
        ? [
            prisma.refund.create({
              data: {
                bookingId: booking.id,
                amount: booking.grandTotal,
                reason: parsed.data.reason ?? "Cancelled by guest",
                status: "REQUESTED",
              },
            }),
          ]
        : []),
    ]);

    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard");

    return wasPaid
      ? warn(`${booking.reference} cancelled — your refund is being processed`)
      : ok(`${booking.reference} cancelled`);
  });
}
