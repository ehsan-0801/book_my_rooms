"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAudit, requireActor } from "@/lib/rbac";
import { fail, guard, ok, warn, type ActionResult } from "./result";

/** Ratings are denormalised onto Property for search speed — recompute on write. */
async function syncPropertyRating(propertyId: string) {
  const agg = await prisma.review.aggregate({
    where: { propertyId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      ratingAvg: Number(agg._avg?.rating ?? 0).toFixed(2),
      ratingCount: agg._count?._all ?? 0,
    },
  });
}

const reviewFields = {
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z
    .string()
    .min(10, "Tell other travellers a little more")
    .max(2000, "Keep it under 2000 characters"),
};

export async function createReview(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireActor();
    const parsed = z
      .object({ bookingId: z.string().min(1), ...reviewFields })
      .safeParse({
        bookingId: formData.get("bookingId"),
        rating: formData.get("rating"),
        title: formData.get("title") || undefined,
        comment: formData.get("comment"),
      });
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(errors.comment?.[0] ?? "Check the review details", errors);
    }

    // Only a completed stay by this user can be reviewed (SRS §32).
    const booking = await prisma.booking.findFirst({
      where: { id: parsed.data.bookingId, userId: actor.id, status: "COMPLETED" },
      select: { id: true, propertyId: true, review: { select: { id: true } } },
    });
    if (!booking) return warn("You can only review a stay you've completed");
    if (booking.review) return warn("You've already reviewed this stay");

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        propertyId: booking.propertyId,
        userId: actor.id,
        rating: parsed.data.rating,
        title: parsed.data.title ?? null,
        comment: parsed.data.comment,
        isApproved: false, // held for moderation
      },
      select: { id: true },
    });

    await recordAudit(actor.id, "review.create", "Review", review.id);
    revalidatePath("/dashboard/reviews");
    return ok("Thanks — your review is awaiting moderation", "/dashboard/reviews");
  });
}

export async function updateReview(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireActor();
    const id = String(formData.get("id") ?? "");
    const parsed = z.object(reviewFields).safeParse({
      rating: formData.get("rating"),
      title: formData.get("title") || undefined,
      comment: formData.get("comment"),
    });
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(errors.comment?.[0] ?? "Check the review details", errors);
    }

    const review = await prisma.review.findFirst({
      where: { id, userId: actor.id },
      select: { id: true, propertyId: true },
    });
    if (!review) return warn("You don't have access to that review");

    await prisma.review.update({
      where: { id },
      data: {
        rating: parsed.data.rating,
        title: parsed.data.title ?? null,
        comment: parsed.data.comment,
        isApproved: false, // an edit re-enters moderation
      },
    });

    await syncPropertyRating(review.propertyId);
    await recordAudit(actor.id, "review.update", "Review", id);
    revalidatePath("/dashboard/reviews");
    return ok("Review updated — it'll reappear once approved", "/dashboard/reviews");
  });
}

export async function deleteReview(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireActor();
    const id = String(formData.get("id") ?? "");

    // Admins may remove any review; a customer only their own.
    const review = await prisma.review.findFirst({
      where: { id, ...(actor.role === "ADMIN" ? {} : { userId: actor.id }) },
      select: { id: true, propertyId: true },
    });
    if (!review) return warn("You don't have access to that review");

    await prisma.review.delete({ where: { id } });
    await syncPropertyRating(review.propertyId);
    await recordAudit(actor.id, "review.delete", "Review", id);
    revalidatePath("/dashboard/reviews");
    return ok("Review deleted and the property rating recalculated");
  });
}
