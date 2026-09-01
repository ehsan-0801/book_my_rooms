"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAudit, requireAdminActor } from "@/lib/rbac";
import { fail, guard, ok, warn, type ActionResult } from "./result";

/* Admin mutations. Every one re-checks the caller's role server-side — the
   middleware only proves a session exists, never that it may act (SRS §5.4). */

export async function setVendorStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const parsed = z
      .object({
        id: z.string().min(1),
        status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "REJECTED"]),
      })
      .safeParse({ id: formData.get("id"), status: formData.get("status") });
    if (!parsed.success) return fail("That status isn't valid");

    const { id, status } = parsed.data;
    const vendor = await prisma.vendor.update({
      where: { id },
      data: { status, approvedAt: status === "APPROVED" ? new Date() : null },
      select: { businessName: true },
    });

    // A suspended or rejected vendor's listings must leave search immediately.
    let pulled = 0;
    if (status === "SUSPENDED" || status === "REJECTED") {
      const result = await prisma.property.updateMany({
        where: { vendorId: id, status: "PUBLISHED" },
        data: { status: "UNPUBLISHED" },
      });
      pulled = result.count;
    }

    await recordAudit(admin.id, `vendor.${status.toLowerCase()}`, "Vendor", id, { status });
    revalidatePath("/dashboard/vendors");
    revalidatePath("/dashboard");

    if (pulled > 0) {
      return warn(
        `${vendor.businessName} ${status.toLowerCase()} — ${pulled} listing${pulled === 1 ? "" : "s"} pulled from search`,
      );
    }
    return ok(`${vendor.businessName} is now ${status.toLowerCase()}`);
  });
}

export async function setPropertyStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const parsed = z
      .object({
        id: z.string().min(1),
        status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "UNPUBLISHED", "REJECTED"]),
        rejectionReason: z.string().optional(),
      })
      .safeParse({
        id: formData.get("id"),
        status: formData.get("status"),
        rejectionReason: formData.get("rejectionReason") ?? undefined,
      });
    if (!parsed.success) return fail("That status isn't valid");

    const { id, status, rejectionReason } = parsed.data;
    const property = await prisma.property.update({
      where: { id },
      data: { status, rejectionReason: status === "REJECTED" ? rejectionReason : null },
      select: { name: true },
    });

    await recordAudit(admin.id, `property.${status.toLowerCase()}`, "Property", id, { status });
    revalidatePath("/dashboard/properties");
    revalidatePath("/dashboard");

    return ok(
      status === "PUBLISHED"
        ? `${property.name} is live in search`
        : `${property.name} is now ${status.toLowerCase().replace("_", " ")}`,
    );
  });
}

export async function togglePropertyFeatured(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    if (!id) return fail("Missing property");

    const current = await prisma.property.findUnique({
      where: { id },
      select: { isFeatured: true, name: true, status: true },
    });
    if (!current) return fail("That property no longer exists");

    const next = !current.isFeatured;
    if (next && current.status !== "PUBLISHED") {
      return warn(`${current.name} must be published before it can be featured`);
    }

    await prisma.property.update({ where: { id }, data: { isFeatured: next } });
    await recordAudit(admin.id, "property.feature", "Property", id, { isFeatured: next });
    revalidatePath("/dashboard/properties");
    revalidatePath("/");

    return ok(
      next
        ? `${current.name} added to the homepage`
        : `${current.name} removed from the homepage`,
    );
  });
}

export async function moderateReview(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const parsed = z
      .object({ id: z.string().min(1), approve: z.enum(["true", "false"]) })
      .safeParse({ id: formData.get("id"), approve: formData.get("approve") });
    if (!parsed.success) return fail("Invalid moderation request");

    const { id, approve } = parsed.data;
    const isApproved = approve === "true";

    const review = await prisma.review.update({
      where: { id },
      data: { isApproved },
      select: { propertyId: true },
    });

    // Property rating is denormalised for search speed, so it has to be
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

    await recordAudit(admin.id, isApproved ? "review.approve" : "review.reject", "Review", id);
    revalidatePath("/dashboard/reviews");

    return ok(isApproved ? "Review published" : "Review hidden from the listing");
  });
}

export async function toggleBanner(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const current = await prisma.banner.findUnique({
      where: { id },
      select: { isActive: true, title: true },
    });
    if (!current) return fail("That banner no longer exists");

    await prisma.banner.update({ where: { id }, data: { isActive: !current.isActive } });
    await recordAudit(admin.id, "banner.toggle", "Banner", id, { isActive: !current.isActive });
    revalidatePath("/dashboard/banners");
    revalidatePath("/");

    return ok(current.isActive ? `"${current.title}" paused` : `"${current.title}" is live`);
  });
}

export async function setVendorCommission(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const parsed = z
      .object({ id: z.string().min(1), rate: z.coerce.number().min(0).max(50) })
      .safeParse({ id: formData.get("id"), rate: formData.get("rate") });
    if (!parsed.success) {
      return fail("Commission must be between 0 and 50%", {
        rate: ["Enter a rate between 0 and 50"],
      });
    }

    const vendor = await prisma.vendor.update({
      where: { id: parsed.data.id },
      data: { commissionRate: parsed.data.rate },
      select: { businessName: true },
    });
    await recordAudit(admin.id, "vendor.commission", "Vendor", parsed.data.id, {
      rate: parsed.data.rate,
    });
    revalidatePath("/dashboard/vendors");

    return ok(`${vendor.businessName} commission set to ${parsed.data.rate}%`);
  });
}

export async function setCustomerActive(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const parsed = z
      .object({ id: z.string().min(1), active: z.enum(["true", "false"]) })
      .safeParse({ id: formData.get("id"), active: formData.get("active") });
    if (!parsed.success) return fail("Invalid request");

    if (parsed.data.id === admin.id) {
      return warn("You can't deactivate your own account");
    }

    const user = await prisma.user.update({
      where: { id: parsed.data.id },
      data: { isActive: parsed.data.active === "true" },
      select: { name: true },
    });
    await recordAudit(admin.id, "customer.setActive", "User", parsed.data.id);
    revalidatePath("/dashboard/customers");

    return parsed.data.active === "true"
      ? ok(`${user.name} reactivated`)
      : warn(`${user.name} deactivated — they can no longer sign in`);
  });
}

/* ------------------------------------------------------- refunds (SRS §28) */

export async function setRefundStatus(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const parsed = z
      .object({
        id: z.string().min(1),
        status: z.enum(["APPROVED", "REJECTED", "PROCESSING", "COMPLETED"]),
        adminNote: z.string().max(500).optional(),
      })
      .safeParse({
        id: formData.get("id"),
        status: formData.get("status"),
        adminNote: formData.get("adminNote") ?? undefined,
      });
    if (!parsed.success) return fail("That refund status isn't valid");

    const { id, status, adminNote } = parsed.data;
    const refund = await prisma.refund.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote ?? undefined,
        processedAt: status === "COMPLETED" || status === "REJECTED" ? new Date() : null,
      },
      select: { bookingId: true, amount: true },
    });

    // Completing a refund settles the booking's financial state too.
    if (status === "COMPLETED") {
      await prisma.booking.update({
        where: { id: refund.bookingId },
        data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
      });
      await prisma.payment.updateMany({
        where: { bookingId: refund.bookingId, status: "PAID" },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
    }

    await recordAudit(admin.id, `refund.${status.toLowerCase()}`, "Refund", id, { status });
    revalidatePath("/dashboard/refunds");
    revalidatePath("/dashboard/payments");

    return status === "REJECTED"
      ? warn("Refund request rejected")
      : ok(`Refund marked ${status.toLowerCase()}`);
  });
}

/* -------------------------------------------------- payouts (SRS §84) */

export async function createPayout(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const vendorId = String(formData.get("vendorId") ?? "");
    if (!vendorId) return fail("Choose a vendor");

    // Settle every commission that has been earned but not yet paid out.
    const earned = await prisma.commission.findMany({
      where: { vendorId, status: "EARNED", payoutId: null },
      select: { id: true, baseAmount: true, amount: true, vendorPayout: true },
    });
    if (earned.length === 0) {
      return warn("That vendor has nothing awaiting settlement");
    }

    const gross = earned.reduce((n, c) => n + Number(c.baseAmount), 0);
    const commission = earned.reduce((n, c) => n + Number(c.amount), 0);
    const net = earned.reduce((n, c) => n + Number(c.vendorPayout), 0);

    const today = new Date();
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - 30);

    const payout = await prisma.$transaction(async (tx) => {
      const created = await tx.payout.create({
        data: {
          vendorId,
          periodStart,
          periodEnd: today,
          grossAmount: gross,
          commission,
          netAmount: net,
          status: "PAID",
          reference: `PO-${Date.now().toString(36).toUpperCase()}`,
          paidAt: today,
        },
      });
      await tx.commission.updateMany({
        where: { id: { in: earned.map((c) => c.id) } },
        data: { payoutId: created.id, status: "SETTLED" },
      });
      return created;
    });

    await recordAudit(admin.id, "payout.create", "Payout", payout.id, { net });
    revalidatePath("/dashboard/payouts");
    revalidatePath("/dashboard/commissions");

    return ok(
      `Settled ${earned.length} booking${earned.length === 1 ? "" : "s"} — ৳${net.toLocaleString("en-BD")} paid out`,
    );
  });
}
