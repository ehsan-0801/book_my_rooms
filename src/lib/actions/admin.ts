"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Admin mutations. Every one re-checks the caller's role server-side — the
 * middleware only proves a session exists, never that it may act (SRS §5.4).
 */
async function assertAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  return session.user;
}

/** Records who changed what, for §66 audit logging. */
async function audit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  after?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: { userId, action, entityType, entityId, after },
  });
}

const idSchema = z.object({ id: z.string().min(1) });

export async function setVendorStatus(formData: FormData) {
  const admin = await assertAdmin();
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "REJECTED"]),
    })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) throw new Error("Invalid input");

  const { id, status } = parsed.data;
  await prisma.vendor.update({
    where: { id },
    data: { status, approvedAt: status === "APPROVED" ? new Date() : null },
  });

  // A suspended or rejected vendor's listings must leave search immediately.
  if (status === "SUSPENDED" || status === "REJECTED") {
    await prisma.property.updateMany({
      where: { vendorId: id, status: "PUBLISHED" },
      data: { status: "UNPUBLISHED" },
    });
  }

  await audit(admin.id, `vendor.${status.toLowerCase()}`, "Vendor", id, { status });
  revalidatePath("/dashboard/vendors");
  revalidatePath("/dashboard");
}

export async function setPropertyStatus(formData: FormData) {
  const admin = await assertAdmin();
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum([
        "DRAFT", "PENDING_REVIEW", "PUBLISHED", "UNPUBLISHED", "REJECTED",
      ]),
      rejectionReason: z.string().optional(),
    })
    .safeParse({
      id: formData.get("id"),
      status: formData.get("status"),
      rejectionReason: formData.get("rejectionReason") ?? undefined,
    });
  if (!parsed.success) throw new Error("Invalid input");

  const { id, status, rejectionReason } = parsed.data;
  await prisma.property.update({
    where: { id },
    data: { status, rejectionReason: status === "REJECTED" ? rejectionReason : null },
  });

  await audit(admin.id, `property.${status.toLowerCase()}`, "Property", id, { status });
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard");
}

export async function togglePropertyFeatured(formData: FormData) {
  const admin = await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });

  const current = await prisma.property.findUniqueOrThrow({
    where: { id },
    select: { isFeatured: true },
  });
  await prisma.property.update({
    where: { id },
    data: { isFeatured: !current.isFeatured },
  });

  await audit(admin.id, "property.feature", "Property", id, {
    isFeatured: !current.isFeatured,
  });
  revalidatePath("/dashboard/properties");
  revalidatePath("/");
}

export async function moderateReview(formData: FormData) {
  const admin = await assertAdmin();
  const parsed = z
    .object({ id: z.string().min(1), approve: z.enum(["true", "false"]) })
    .safeParse({ id: formData.get("id"), approve: formData.get("approve") });
  if (!parsed.success) throw new Error("Invalid input");

  const { id, approve } = parsed.data;
  const isApproved = approve === "true";

  const review = await prisma.review.update({
    where: { id },
    data: { isApproved },
    select: { propertyId: true },
  });

  // Property rating is denormalised for search performance, so it has to be
  // recomputed from the approved reviews whenever moderation changes.
  const agg = await prisma.review.aggregate({
    where: { propertyId: review.propertyId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.property.update({
    where: { id: review.propertyId },
    data: {
      ratingAvg: Number(agg._avg?.rating ?? 0).toFixed(2),
      ratingCount: agg._count?._all ?? 0,
    },
  });

  await audit(admin.id, isApproved ? "review.approve" : "review.reject", "Review", id);
  revalidatePath("/dashboard/reviews");
}

export async function toggleBanner(formData: FormData) {
  const admin = await assertAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });

  const current = await prisma.banner.findUniqueOrThrow({
    where: { id },
    select: { isActive: true },
  });
  await prisma.banner.update({ where: { id }, data: { isActive: !current.isActive } });

  await audit(admin.id, "banner.toggle", "Banner", id, { isActive: !current.isActive });
  revalidatePath("/dashboard/banners");
}

export async function setVendorCommission(formData: FormData) {
  const admin = await assertAdmin();
  const parsed = z
    .object({ id: z.string().min(1), rate: z.coerce.number().min(0).max(50) })
    .safeParse({ id: formData.get("id"), rate: formData.get("rate") });
  if (!parsed.success) throw new Error("Commission must be between 0 and 50%");

  await prisma.vendor.update({
    where: { id: parsed.data.id },
    data: { commissionRate: parsed.data.rate },
  });
  await audit(admin.id, "vendor.commission", "Vendor", parsed.data.id, {
    rate: parsed.data.rate,
  });
  revalidatePath("/dashboard/vendors");
}

export async function setCustomerActive(formData: FormData) {
  const admin = await assertAdmin();
  const parsed = z
    .object({ id: z.string().min(1), active: z.enum(["true", "false"]) })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) throw new Error("Invalid input");

  await prisma.user.update({
    where: { id: parsed.data.id },
    data: { isActive: parsed.data.active === "true" },
  });
  await audit(admin.id, "customer.setActive", "User", parsed.data.id);
  revalidatePath("/dashboard/customers");
}
