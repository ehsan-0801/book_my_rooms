"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAudit, requireActor } from "@/lib/rbac";

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

const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(10, "Tell other travellers a little more").max(2000),
});

export async function createReview(formData: FormData) {
  const actor = await requireActor();
  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    title: formData.get("title") || undefined,
    comment: formData.get("comment"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  // Only a completed stay by this user can be reviewed (SRS §32).
  const booking = await prisma.booking.findFirst({
    where: { id: parsed.data.bookingId, userId: actor.id, status: "COMPLETED" },
    select: { id: true, propertyId: true, review: { select: { id: true } } },
  });
  if (!booking) throw new Error("You can only review a stay you've completed");
  if (booking.review) throw new Error("You've already reviewed this stay");

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
  redirect("/dashboard/reviews");
}

export async function updateReview(formData: FormData) {
  const actor = await requireActor();
  const id = formData.get("id")?.toString() ?? "";
  const parsed = z
    .object({
      rating: z.coerce.number().int().min(1).max(5),
      title: z.string().max(120).optional(),
      comment: z.string().min(10).max(2000),
    })
    .safeParse({
      rating: formData.get("rating"),
      title: formData.get("title") || undefined,
      comment: formData.get("comment"),
    });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const review = await prisma.review.findFirst({
    where: { id, userId: actor.id },
    select: { id: true, propertyId: true },
  });
  if (!review) throw new Error("Forbidden");

  await prisma.review.update({
    where: { id },
    data: {
      rating: parsed.data.rating,
      title: parsed.data.title ?? null,
      comment: parsed.data.comment,
      // An edit re-enters moderation.
      isApproved: false,
    },
  });

  await syncPropertyRating(review.propertyId);
  await recordAudit(actor.id, "review.update", "Review", id);
  revalidatePath("/dashboard/reviews");
  redirect("/dashboard/reviews");
}

export async function deleteReview(formData: FormData) {
  const actor = await requireActor();
  const id = formData.get("id")?.toString() ?? "";

  // Admins may remove any review; a customer only their own.
  const review = await prisma.review.findFirst({
    where: { id, ...(actor.role === "ADMIN" ? {} : { userId: actor.id }) },
    select: { id: true, propertyId: true },
  });
  if (!review) throw new Error("Forbidden");

  await prisma.review.delete({ where: { id } });
  await syncPropertyRating(review.propertyId);
  await recordAudit(actor.id, "review.delete", "Review", id);
  revalidatePath("/dashboard/reviews");
}
