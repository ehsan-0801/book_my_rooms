"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Vendor mutations. Each one resolves the caller's own vendorId and scopes the
 * write to it — a vendor must never be able to touch another vendor's rows
 * (SRS §5.4), so the id is never taken from the form.
 */
async function assertVendor() {
  const session = await auth();
  if (session?.user?.role !== "VENDOR" || !session.user.vendorId) {
    throw new Error("Forbidden");
  }
  return { userId: session.user.id, vendorId: session.user.vendorId };
}

/** Throws unless the room belongs to the calling vendor. */
async function assertOwnsRoom(vendorId: string, roomId: string) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, property: { vendorId } },
    select: { id: true, propertyId: true },
  });
  if (!room) throw new Error("Forbidden");
  return room;
}

export async function updateRoomRate(formData: FormData) {
  const { vendorId } = await assertVendor();
  const parsed = z
    .object({
      roomId: z.string().min(1),
      basePrice: z.coerce.number().min(0).max(1_000_000),
      discountValue: z.coerce.number().min(0).max(90).optional(),
      totalUnits: z.coerce.number().int().min(0).max(500),
    })
    .safeParse({
      roomId: formData.get("roomId"),
      basePrice: formData.get("basePrice"),
      discountValue: formData.get("discountValue") || undefined,
      totalUnits: formData.get("totalUnits"),
    });
  if (!parsed.success) throw new Error("Check the rate, discount and room count");

  const { roomId, basePrice, discountValue, totalUnits } = parsed.data;
  await assertOwnsRoom(vendorId, roomId);

  const room = await prisma.room.update({
    where: { id: roomId },
    data: {
      basePrice,
      totalUnits,
      discountType: discountValue ? "PERCENTAGE" : null,
      discountValue: discountValue ?? null,
    },
    select: { propertyId: true },
  });

  // basePrice on Property drives the search price filter and "from" price.
  const cheapest = await prisma.room.aggregate({
    where: { propertyId: room.propertyId, isActive: true },
    _min: { basePrice: true },
  });
  await prisma.property.update({
    where: { id: room.propertyId },
    data: { basePrice: cheapest._min?.basePrice ?? basePrice },
  });

  revalidatePath("/dashboard/rooms");
  revalidatePath("/dashboard/properties");
}

export async function setDateAvailability(formData: FormData) {
  const { vendorId } = await assertVendor();
  const parsed = z
    .object({
      roomId: z.string().min(1),
      date: z.string().min(1),
      unitsOpen: z.coerce.number().int().min(0).max(500),
      isClosed: z.enum(["true", "false"]).optional(),
      price: z.coerce.number().min(0).max(1_000_000).optional(),
    })
    .safeParse({
      roomId: formData.get("roomId"),
      date: formData.get("date"),
      unitsOpen: formData.get("unitsOpen"),
      isClosed: formData.get("isClosed") ?? undefined,
      price: formData.get("price") || undefined,
    });
  if (!parsed.success) throw new Error("Invalid availability input");

  const { roomId, date, unitsOpen, isClosed, price } = parsed.data;
  await assertOwnsRoom(vendorId, roomId);

  const day = new Date(`${date}T00:00:00.000Z`);
  await prisma.roomAvailability.upsert({
    where: { roomId_date: { roomId, date: day } },
    update: { unitsOpen, isClosed: isClosed === "true", price: price ?? null },
    create: {
      roomId, date: day, unitsOpen,
      isClosed: isClosed === "true", price: price ?? null,
    },
  });

  revalidatePath("/dashboard/availability");
}

export async function bulkCloseDates(formData: FormData) {
  const { vendorId } = await assertVendor();
  const parsed = z
    .object({
      roomId: z.string().min(1),
      from: z.string().min(1),
      to: z.string().min(1),
      close: z.enum(["true", "false"]),
    })
    .safeParse({
      roomId: formData.get("roomId"),
      from: formData.get("from"),
      to: formData.get("to"),
      close: formData.get("close"),
    });
  if (!parsed.success) throw new Error("Invalid date range");

  const { roomId, from, to, close } = parsed.data;
  await assertOwnsRoom(vendorId, roomId);

  await prisma.roomAvailability.updateMany({
    where: {
      roomId,
      date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
    },
    data: { isClosed: close === "true" },
  });

  revalidatePath("/dashboard/availability");
}

export async function setBookingStatus(formData: FormData) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "VENDOR" && role !== "ADMIN") throw new Error("Forbidden");

  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"]),
    })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) throw new Error("Invalid status");

  const { id, status } = parsed.data;

  // Vendors may only touch bookings at their own properties.
  const where =
    role === "VENDOR"
      ? { id, property: { vendorId: session!.user.vendorId! } }
      : { id };
  const booking = await prisma.booking.findFirst({ where, select: { id: true } });
  if (!booking) throw new Error("Forbidden");

  const isCancel = status === "CANCELLED" || status === "REJECTED";
  await prisma.booking.update({
    where: { id },
    data: {
      status: status === "NO_SHOW" ? "COMPLETED" : status,
      cancelledAt: isCancel ? new Date() : null,
    },
  });

  // Commission follows the booking (SRS §83): earned on completion, reversed
  // when the stay never happens.
  await prisma.commission.updateMany({
    where: { bookingId: id },
    data:
      status === "COMPLETED"
        ? { status: "EARNED", earnedAt: new Date() }
        : isCancel
          ? { status: "REVERSED", reversedAt: new Date() }
          : { status: "PENDING" },
  });

  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
}

export async function replyToReview(formData: FormData) {
  const { vendorId } = await assertVendor();
  const parsed = z
    .object({ id: z.string().min(1), reply: z.string().min(2).max(1000) })
    .safeParse({ id: formData.get("id"), reply: formData.get("reply") });
  if (!parsed.success) throw new Error("Write a reply of at least 2 characters");

  const review = await prisma.review.findFirst({
    where: { id: parsed.data.id, property: { vendorId } },
    select: { id: true },
  });
  if (!review) throw new Error("Forbidden");

  await prisma.review.update({
    where: { id: parsed.data.id },
    data: { vendorReply: parsed.data.reply },
  });
  revalidatePath("/dashboard/reviews");
}
