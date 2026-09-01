"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fail, guard, ok, warn, type ActionResult } from "./result";

/**
 * Vendor mutations. Each resolves the caller's own vendorId and scopes the
 * write to it — a vendor must never touch another vendor's rows (SRS §5.4),
 * so the id is never taken from the form.
 */
async function assertVendor() {
  const session = await auth();
  if (session?.user?.role !== "VENDOR" || !session.user.vendorId) {
    throw new Error("Forbidden");
  }
  return { userId: session.user.id, vendorId: session.user.vendorId };
}

async function assertOwnsRoom(vendorId: string, roomId: string) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, property: { vendorId } },
    select: { id: true, propertyId: true, name: true },
  });
  if (!room) throw new Error("Forbidden");
  return room;
}

export async function setDateAvailability(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
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
    if (!parsed.success) return fail("Check the units and price for that night");

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
    const label = new Date(day).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", timeZone: "UTC",
    });
    return isClosed === "true"
      ? warn(`${label} closed for sale`)
      : ok(`${label} updated — ${unitsOpen} room${unitsOpen === 1 ? "" : "s"} open`);
  });
}

export async function bulkCloseDates(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
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
    if (!parsed.success) return fail("Choose a valid date range");

    const { roomId, from, to, close } = parsed.data;
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if (end < start) return fail("The end date must be on or after the start date");

    await assertOwnsRoom(vendorId, roomId);

    const result = await prisma.roomAvailability.updateMany({
      where: { roomId, date: { gte: start, lte: end } },
      data: { isClosed: close === "true" },
    });

    revalidatePath("/dashboard/availability");
    if (result.count === 0) return warn("No nights in that range to update");

    return close === "true"
      ? warn(`${result.count} night${result.count === 1 ? "" : "s"} closed for sale`)
      : ok(`${result.count} night${result.count === 1 ? "" : "s"} reopened`);
  });
}

export async function setBookingStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "VENDOR" && role !== "ADMIN") throw new Error("Forbidden");

    const parsed = z
      .object({
        id: z.string().min(1),
        status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"]),
      })
      .safeParse({ id: formData.get("id"), status: formData.get("status") });
    if (!parsed.success) return fail("That booking status isn't valid");

    const { id, status } = parsed.data;

    // Vendors may only touch bookings at their own properties.
    const where =
      role === "VENDOR"
        ? { id, property: { vendorId: session!.user.vendorId! } }
        : { id };
    const booking = await prisma.booking.findFirst({
      where,
      select: { id: true, reference: true },
    });
    if (!booking) return warn("You don't have access to that booking");

    const isCancel = status === "CANCELLED" || status === "REJECTED";
    await prisma.booking.update({
      where: { id },
      data: { status, cancelledAt: isCancel ? new Date() : null },
    });

    // Commission follows the booking (SRS §83): earned on completion,
    // reversed when the stay never happens.
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
    revalidatePath(`/dashboard/bookings/${id}`);
    revalidatePath("/dashboard");

    if (status === "COMPLETED") return ok(`${booking.reference} checked out — commission earned`);
    if (isCancel) return warn(`${booking.reference} cancelled — commission reversed`);
    return ok(`${booking.reference} confirmed`);
  });
}

export async function replyToReview(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const { vendorId } = await assertVendor();
    const parsed = z
      .object({ id: z.string().min(1), reply: z.string().min(2).max(1000) })
      .safeParse({ id: formData.get("id"), reply: formData.get("reply") });
    if (!parsed.success) {
      return fail("Write a reply of at least 2 characters", {
        reply: ["Write a reply of at least 2 characters"],
      });
    }

    const review = await prisma.review.findFirst({
      where: { id: parsed.data.id, property: { vendorId } },
      select: { id: true },
    });
    if (!review) return warn("You don't have access to that review");

    await prisma.review.update({
      where: { id: parsed.data.id },
      data: { vendorReply: parsed.data.reply },
    });
    revalidatePath("/dashboard/reviews");
    return ok("Your reply is now shown under the review");
  });
}
