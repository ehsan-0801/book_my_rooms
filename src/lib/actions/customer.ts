"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function assertUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Forbidden");
  return session.user;
}

export async function toggleWishlist(formData: FormData) {
  const user = await assertUser();
  const propertyId = z.string().min(1).parse(formData.get("propertyId"));

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_propertyId: { userId: user.id, propertyId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId: user.id, propertyId } });
  }

  revalidatePath("/dashboard/wishlist");
}

export async function requestCancellation(formData: FormData) {
  const user = await assertUser();
  const parsed = z
    .object({ id: z.string().min(1), reason: z.string().max(500).optional() })
    .safeParse({ id: formData.get("id"), reason: formData.get("reason") ?? undefined });
  if (!parsed.success) throw new Error("Invalid input");

  // Scope to the caller's own booking — never trust the id alone.
  const booking = await prisma.booking.findFirst({
    where: {
      id: parsed.data.id,
      userId: user.id,
      status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED"] },
    },
    select: { id: true, grandTotal: true, paymentStatus: true },
  });
  if (!booking) throw new Error("That booking can't be cancelled");

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: booking.paymentStatus === "PAID" ? "REFUND_PENDING" : "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: parsed.data.reason ?? "Cancelled by guest",
      },
    }),
    prisma.commission.updateMany({
      where: { bookingId: booking.id },
      data: { status: "REVERSED", reversedAt: new Date() },
    }),
    // A paid booking needs a refund record for the finance queue (SRS §28).
    ...(booking.paymentStatus === "PAID"
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
}

export async function updateProfile(formData: FormData) {
  const user = await assertUser();
  const parsed = z
    .object({
      name: z.string().min(2, "Enter your name"),
      phone: z.string().regex(/^01[3-9]\d{8}$/, "Enter a valid mobile number"),
      avatarUrl: z.string().url().optional().or(z.literal("")),
    })
    .safeParse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      avatarUrl: formData.get("avatarUrl") ?? "",
    });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      avatarUrl: parsed.data.avatarUrl || null,
    },
  });

  revalidatePath("/dashboard/settings");
}
