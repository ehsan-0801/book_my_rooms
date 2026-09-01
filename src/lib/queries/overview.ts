import { prisma } from "@/lib/prisma";
import type { BookingStatus, CommissionStatus } from "@/generated/prisma/client";

const DAY = 86_400_000;
const since = (days: number) => new Date(Date.now() - days * DAY);

/** Percent change between two periods, guarding division by zero. */
function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

// Mutable array: Prisma's `in` filter rejects a readonly tuple.
const EARNED_OR_SETTLED: CommissionStatus[] = ["EARNED", "SETTLED"];
const REVENUE_STATUSES: BookingStatus[] = ["CONFIRMED", "COMPLETED"];

export async function getAdminOverview() {
  const [
    vendorsTotal, vendorsPending, propertiesPublished, propertiesPending,
    customersTotal, bookings30, bookingsPrev30, revenue30, revenuePrev30,
    commission30, reviewsPending, recentBookings, pendingVendors,
  ] = await Promise.all([
    prisma.vendor.count(),
    prisma.vendor.count({ where: { status: "PENDING" } }),
    prisma.property.count({ where: { status: "PUBLISHED" } }),
    prisma.property.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.booking.count({ where: { createdAt: { gte: since(30) } } }),
    prisma.booking.count({ where: { createdAt: { gte: since(60), lt: since(30) } } }),
    prisma.booking.aggregate({
      _sum: { grandTotal: true },
      where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since(30) } },
    }),
    prisma.booking.aggregate({
      _sum: { grandTotal: true },
      where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: since(60), lt: since(30) } },
    }),
    prisma.commission.aggregate({
      _sum: { amount: true },
      where: { status: { in: EARNED_OR_SETTLED }, createdAt: { gte: since(30) } },
    }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, reference: true, guestName: true, grandTotal: true,
        status: true, paymentStatus: true, createdAt: true, checkIn: true,
        property: { select: { name: true, slug: true } },
      },
    }),
    prisma.vendor.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, businessName: true, contactEmail: true, createdAt: true },
    }),
  ]);

  const gmv = Number(revenue30._sum?.grandTotal ?? 0);
  const gmvPrev = Number(revenuePrev30._sum?.grandTotal ?? 0);

  return {
    vendorsTotal, vendorsPending, propertiesPublished, propertiesPending,
    customersTotal, bookings30,
    bookingsDelta: delta(bookings30, bookingsPrev30),
    gmv,
    gmvDelta: delta(gmv, gmvPrev),
    commission30: Number(commission30._sum?.amount ?? 0),
    reviewsPending, recentBookings, pendingVendors,
  };
}

export async function getVendorOverview(vendorId: string) {
  const [
    properties, rooms, bookings30, bookingsPrev30, revenue30, revenuePrev30,
    earnings, upcoming, recentBookings, ratingAgg,
  ] = await Promise.all([
    prisma.property.count({ where: { vendorId } }),
    prisma.room.count({ where: { property: { vendorId } } }),
    prisma.booking.count({ where: { property: { vendorId }, createdAt: { gte: since(30) } } }),
    prisma.booking.count({
      where: { property: { vendorId }, createdAt: { gte: since(60), lt: since(30) } },
    }),
    prisma.booking.aggregate({
      _sum: { grandTotal: true },
      where: {
        property: { vendorId }, status: { in: REVENUE_STATUSES },
        createdAt: { gte: since(30) },
      },
    }),
    prisma.booking.aggregate({
      _sum: { grandTotal: true },
      where: {
        property: { vendorId }, status: { in: REVENUE_STATUSES },
        createdAt: { gte: since(60), lt: since(30) },
      },
    }),
    prisma.commission.aggregate({
      _sum: { vendorPayout: true, amount: true },
      where: { vendorId, status: { in: EARNED_OR_SETTLED } },
    }),
    prisma.booking.count({
      where: { property: { vendorId }, status: "CONFIRMED", checkIn: { gte: new Date() } },
    }),
    prisma.booking.findMany({
      where: { property: { vendorId } },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, reference: true, guestName: true, grandTotal: true,
        status: true, paymentStatus: true, checkIn: true, checkOut: true,
        property: { select: { name: true } },
      },
    }),
    prisma.property.aggregate({
      _avg: { ratingAvg: true },
      _sum: { ratingCount: true },
      where: { vendorId },
    }),
  ]);

  const rev = Number(revenue30._sum?.grandTotal ?? 0);
  const revPrev = Number(revenuePrev30._sum?.grandTotal ?? 0);

  return {
    properties, rooms, bookings30,
    bookingsDelta: delta(bookings30, bookingsPrev30),
    revenue30: rev,
    revenueDelta: delta(rev, revPrev),
    netEarnings: Number(earnings._sum?.vendorPayout ?? 0),
    commissionPaid: Number(earnings._sum?.amount ?? 0),
    upcoming, recentBookings,
    ratingAvg: Number(ratingAgg._avg?.ratingAvg ?? 0),
    ratingCount: ratingAgg._sum?.ratingCount ?? 0,
  };
}

export async function getCustomerOverview(userId: string) {
  const now = new Date();
  const [upcoming, past, wishlist, reviews, spend, nextTrip] = await Promise.all([
    prisma.booking.count({ where: { userId, status: "CONFIRMED", checkIn: { gte: now } } }),
    prisma.booking.count({ where: { userId, status: "COMPLETED" } }),
    prisma.wishlistItem.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.booking.aggregate({
      _sum: { grandTotal: true },
      where: { userId, status: { in: REVENUE_STATUSES } },
    }),
    prisma.booking.findFirst({
      where: { userId, checkIn: { gte: now }, status: { in: ["CONFIRMED", "PENDING"] as BookingStatus[] } },
      orderBy: { checkIn: "asc" },
      select: {
        id: true, reference: true, checkIn: true, checkOut: true, nights: true,
        status: true, grandTotal: true,
        property: {
          select: {
            name: true, slug: true, addressLine: true,
            district: { select: { slug: true, name: true } },
            images: { where: { isCover: true }, take: 1, select: { url: true, alt: true } },
          },
        },
      },
    }),
  ]);

  return {
    upcoming, past, wishlist, reviews,
    totalSpend: Number(spend._sum?.grandTotal ?? 0),
    nextTrip,
  };
}
