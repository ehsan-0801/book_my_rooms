import "server-only";

import { prisma } from "@/lib/prisma";
import type { Actor, Role } from "@/lib/rbac";
import {
  getAdminOverview,
  getCustomerOverview,
  getVendorOverview,
} from "@/lib/queries/overview";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Every dashboard read, declared with the roles allowed to perform it.
 *
 * Client-rendered pages cannot be trusted to gate their own data, so the roles
 * live here beside the query and are checked by the route handler before the
 * loader ever runs. Vendor-scoped resources additionally pin their `where` to
 * the caller's own vendorId — a vendor asking for "properties" can only ever
 * receive their own, regardless of what they send.
 */
export interface LoaderContext {
  actor: Actor;
  searchParams: URLSearchParams;
  id?: string;
}

interface Resource {
  roles: Role[];
  load: (ctx: LoaderContext) => Promise<unknown>;
}

/** Restricts a query to the caller's own listings unless they're an admin. */
const vendorScope = (actor: Actor) =>
  actor.role === "ADMIN" ? {} : { vendorId: actor.vendorId ?? "__none__" };

const one = (sp: URLSearchParams, key: string) => sp.get(key) ?? undefined;

export const RESOURCES = {
  /* ------------------------------------------------------------- overview */
  overview: {
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    load: async ({ actor }) => {
      if (actor.role === "ADMIN") return { role: actor.role, data: await getAdminOverview() };
      if (actor.role === "VENDOR") {
        if (!actor.vendorId) return { role: actor.role, data: null };
        return { role: actor.role, data: await getVendorOverview(actor.vendorId) };
      }
      return { role: actor.role, data: await getCustomerOverview(actor.id) };
    },
  },

  /* -------------------------------------------------------------- vendors */
  vendors: {
    roles: ["ADMIN"],
    load: async ({ searchParams }) => {
      const status = one(searchParams, "status");
      const where: Prisma.VendorWhereInput =
        status && status !== "all"
          ? { status: status as Prisma.VendorWhereInput["status"] }
          : {};

      const [vendors, earned] = await Promise.all([
        prisma.vendor.findMany({
          where,
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          select: {
            id: true, businessName: true, contactEmail: true, contactPhone: true,
            status: true, commissionRate: true, createdAt: true,
            user: { select: { name: true } },
            _count: { select: { properties: true } },
          },
        }),
        prisma.commission.groupBy({
          by: ["vendorId"],
          where: { status: { in: ["EARNED", "SETTLED"] } },
          _sum: { amount: true },
        }),
      ]);

      return {
        vendors,
        earned: Object.fromEntries(
          earned.map((e) => [e.vendorId, Number(e._sum?.amount ?? 0)]),
        ),
      };
    },
  },

  "vendors/detail": {
    roles: ["ADMIN"],
    load: async ({ id }) => {
      const vendor = await prisma.vendor.findUnique({
        where: { id: id! },
        include: {
          user: { select: { name: true, email: true, createdAt: true } },
          properties: {
            select: {
              id: true, name: true, slug: true, status: true, basePrice: true,
              ratingAvg: true, ratingCount: true,
              district: { select: { name: true, slug: true } },
              _count: { select: { rooms: true, bookings: true } },
            },
          },
          payouts: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      });
      if (!vendor) throw new Error("Vendor not found");

      const commission = await prisma.commission.aggregate({
        where: { vendorId: id! },
        _sum: { amount: true, vendorPayout: true, baseAmount: true },
        _count: { _all: true },
      });
      return { vendor, commission };
    },
  },

  /* ----------------------------------------------------------- properties */
  properties: {
    roles: ["ADMIN", "VENDOR"],
    load: async ({ actor, searchParams }) => {
      const status = one(searchParams, "status");
      const properties = await prisma.property.findMany({
        where: {
          ...vendorScope(actor),
          ...(status && status !== "all"
            ? { status: status as Prisma.PropertyWhereInput["status"] }
            : {}),
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        select: {
          id: true, name: true, slug: true, status: true, isFeatured: true,
          isPremium: true, basePrice: true, ratingAvg: true, ratingCount: true,
          category: true,
          type: { select: { name: true } },
          district: { select: { name: true, slug: true } },
          vendor: { select: { businessName: true } },
          images: { where: { isCover: true }, take: 1, select: { url: true } },
          _count: { select: { rooms: true, bookings: true } },
        },
      });
      return { properties, role: actor.role };
    },
  },

  "properties/form": {
    roles: ["ADMIN", "VENDOR"],
    load: async ({ actor, id }) => {
      const [types, districts, amenities, vendors, property] = await Promise.all([
        prisma.propertyType.findMany({
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true },
        }),
        prisma.district.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        prisma.amenity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        actor.role === "ADMIN"
          ? prisma.vendor.findMany({
              where: { status: "APPROVED" },
              orderBy: { businessName: "asc" },
              select: { id: true, businessName: true },
            })
          : Promise.resolve(null),
        id
          ? prisma.property.findFirst({
              where: { id, ...vendorScope(actor) },
              select: {
                id: true, name: true, typeId: true, districtId: true, areaId: true,
                category: true, shortDescription: true, description: true,
                addressLine: true, contactPhone: true, contactEmail: true,
                website: true, starRating: true, checkInTime: true, checkOutTime: true,
                latitude: true, longitude: true, policies: true, rules: true,
                cancellationPolicy: true, basePrice: true,
                amenities: { select: { amenityId: true } },
                images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
              },
            })
          : Promise.resolve(null),
      ]);

      if (id && !property) throw new Error("Property not found");
      return { types, districts, amenities, vendors, property };
    },
  },

  /* ---------------------------------------------------------------- rooms */
  rooms: {
    roles: ["ADMIN", "VENDOR"],
    load: async ({ actor }) =>
      prisma.room.findMany({
        where: actor.role === "ADMIN" ? {} : { property: vendorScope(actor) },
        orderBy: [{ property: { name: "asc" } }, { basePrice: "asc" }],
        select: {
          id: true, name: true, basePrice: true, discountValue: true,
          totalUnits: true, maxGuests: true, bedType: true, isActive: true,
          breakfastIncluded: true,
          property: { select: { id: true, name: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          _count: { select: { bookingItems: true } },
        },
      }),
  },

  "rooms/form": {
    roles: ["ADMIN", "VENDOR"],
    load: async ({ actor, id }) => {
      const [properties, amenities, room] = await Promise.all([
        prisma.property.findMany({
          where: vendorScope(actor),
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        prisma.amenity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        id
          ? prisma.room.findFirst({
              where: {
                id,
                ...(actor.role === "ADMIN" ? {} : { property: vendorScope(actor) }),
              },
              select: {
                id: true, propertyId: true, name: true, description: true,
                bedType: true, maxGuests: true, maxAdults: true, maxChildren: true,
                sizeSqft: true, totalUnits: true, basePrice: true, discountValue: true,
                breakfastIncluded: true, isRefundable: true, isActive: true,
                amenities: { select: { amenityId: true } },
                images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
              },
            })
          : Promise.resolve(null),
      ]);

      if (id && !room) throw new Error("Room not found");
      return { properties, amenities, room };
    },
  },

  /* ------------------------------------------------------------- bookings */
  bookings: {
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    load: async ({ actor, searchParams }) => {
      const status = one(searchParams, "status");
      const scope: Prisma.BookingWhereInput =
        actor.role === "ADMIN"
          ? {}
          : actor.role === "VENDOR"
            ? { property: vendorScope(actor) }
            : { userId: actor.id };

      const bookings = await prisma.booking.findMany({
        where: {
          ...scope,
          ...(status && status !== "all"
            ? { status: status as Prisma.BookingWhereInput["status"] }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 80,
        select: {
          id: true, reference: true, guestName: true, guestEmail: true,
          guestPhone: true, checkIn: true, checkOut: true, nights: true,
          roomCount: true, grandTotal: true, status: true, paymentStatus: true,
          createdAt: true,
          property: {
            select: { name: true, slug: true, district: { select: { slug: true } } },
          },
          items: { select: { roomName: true, units: true } },
        },
      });
      return { bookings, role: actor.role };
    },
  },

  "bookings/detail": {
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    load: async ({ actor, id }) => {
      const scope: Prisma.BookingWhereInput =
        actor.role === "ADMIN"
          ? {}
          : actor.role === "VENDOR"
            ? { property: vendorScope(actor) }
            : { userId: actor.id };

      const booking = await prisma.booking.findFirst({
        where: { id: id!, ...scope },
        include: {
          property: {
            select: {
              name: true, slug: true, addressLine: true, checkInTime: true,
              checkOutTime: true, cancellationPolicy: true,
              district: { select: { slug: true, name: true } },
              vendor: { select: { businessName: true, contactPhone: true } },
            },
          },
          items: true,
          payments: { orderBy: { createdAt: "desc" } },
          invoice: true,
          commission: true,
          refunds: { orderBy: { requestedAt: "desc" } },
          user: { select: { name: true, email: true } },
        },
      });
      if (!booking) throw new Error("Booking not found");
      return { booking, role: actor.role };
    },
  },

  /* ------------------------------------------------------------ customers */
  customers: {
    roles: ["ADMIN"],
    load: async () => {
      const [customers, spend] = await Promise.all([
        prisma.user.findMany({
          where: { role: "CUSTOMER" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true, name: true, email: true, phone: true, isActive: true,
            createdAt: true,
            _count: { select: { bookings: true, reviews: true, wishlist: true } },
          },
        }),
        prisma.booking.groupBy({
          by: ["userId"],
          where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
          _sum: { grandTotal: true },
        }),
      ]);

      return {
        customers,
        // Lifetime spend per customer, keyed for the table.
        spend: Object.fromEntries(
          spend
            .filter((s) => s.userId)
            .map((s) => [s.userId!, Number(s._sum?.grandTotal ?? 0)]),
        ) as Record<string, number>,
      };
    },
  },

  "customers/detail": {
    roles: ["ADMIN"],
    load: async ({ id }) => {
      const customer = await prisma.user.findFirst({
        where: { id: id!, role: "CUSTOMER" },
        select: {
          id: true, name: true, email: true, phone: true, isActive: true,
          createdAt: true, avatarUrl: true,
          bookings: {
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
              id: true, reference: true, checkIn: true, checkOut: true,
              grandTotal: true, status: true, paymentStatus: true,
              property: { select: { name: true } },
            },
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true, rating: true, title: true, isApproved: true,
              createdAt: true, property: { select: { name: true } },
            },
          },
        },
      });
      if (!customer) throw new Error("Customer not found");

      const spend = await prisma.booking.aggregate({
        where: { userId: id!, status: { in: ["CONFIRMED", "COMPLETED"] } },
        _sum: { grandTotal: true },
      });
      return { customer, totalSpend: Number(spend._sum?.grandTotal ?? 0) };
    },
  },

  /* -------------------------------------------------------------- finance */
  payments: {
    roles: ["ADMIN"],
    load: async () => {
      const [payments, paid, refunded, pendingRefunds] = await Promise.all([
        prisma.payment.findMany({
          orderBy: { createdAt: "desc" },
          take: 80,
          select: {
            id: true, method: true, amount: true, status: true, gatewayRef: true,
            paidAt: true, createdAt: true,
            booking: {
              select: {
                id: true, reference: true, guestName: true,
                property: { select: { name: true } },
              },
            },
          },
        }),
        prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: { _all: true } }),
        prisma.refund.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true }, _count: { _all: true } }),
        prisma.refund.count({
          where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } },
        }),
      ]);
      return {
        payments,
        paidTotal: Number(paid._sum?.amount ?? 0),
        paidCount: paid._count?._all ?? 0,
        refundedTotal: Number(refunded._sum?.amount ?? 0),
        refundedCount: refunded._count?._all ?? 0,
        pendingRefunds,
      };
    },
  },

  refunds: {
    roles: ["ADMIN"],
    load: async ({ searchParams }) => {
      const status = one(searchParams, "status");
      const [refunds, pending, completed] = await Promise.all([
        prisma.refund.findMany({
          where:
            status && status !== "all"
              ? { status: status as Prisma.RefundWhereInput["status"] }
              : {},
          orderBy: { requestedAt: "desc" },
          take: 80,
          select: {
            id: true, amount: true, reason: true, status: true, gatewayRef: true,
            requestedAt: true, processedAt: true,
            booking: {
              select: {
                id: true, reference: true, guestName: true,
                property: { select: { name: true } },
              },
            },
          },
        }),
        prisma.refund.aggregate({
          where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } },
          _sum: { amount: true }, _count: { _all: true },
        }),
        prisma.refund.aggregate({
          where: { status: "COMPLETED" },
          _sum: { amount: true }, _count: { _all: true },
        }),
      ]);
      return {
        refunds,
        pendingTotal: Number(pending._sum?.amount ?? 0),
        pendingCount: pending._count?._all ?? 0,
        completedTotal: Number(completed._sum?.amount ?? 0),
        completedCount: completed._count?._all ?? 0,
      };
    },
  },

  commissions: {
    roles: ["ADMIN"],
    load: async ({ searchParams }) => {
      const status = one(searchParams, "status");
      const [commissions, totals] = await Promise.all([
        prisma.commission.findMany({
          where:
            status && status !== "all"
              ? { status: status as Prisma.CommissionWhereInput["status"] }
              : {},
          orderBy: { createdAt: "desc" },
          take: 80,
          select: {
            id: true, rate: true, baseAmount: true, amount: true,
            vendorPayout: true, status: true, earnedAt: true, createdAt: true,
            booking: {
              select: {
                id: true, reference: true,
                property: { select: { name: true, vendor: { select: { businessName: true } } } },
              },
            },
          },
        }),
        prisma.commission.groupBy({
          by: ["status"],
          _sum: { amount: true },
          _count: { _all: true },
        }),
      ]);
      return {
        commissions,
        byStatus: Object.fromEntries(
          totals.map((t) => [
            t.status,
            { total: Number(t._sum?.amount ?? 0), count: t._count?._all ?? 0 },
          ]),
        ),
      };
    },
  },

  payouts: {
    roles: ["ADMIN"],
    load: async () => {
      const [payouts, owing, settled] = await Promise.all([
        prisma.payout.findMany({
          orderBy: { createdAt: "desc" },
          take: 60,
          select: {
            id: true, periodStart: true, periodEnd: true, grossAmount: true,
            commission: true, netAmount: true, status: true, reference: true,
            paidAt: true, vendor: { select: { businessName: true } },
          },
        }),
        prisma.commission.groupBy({
          by: ["vendorId"],
          where: { status: "EARNED", payoutId: null },
          _sum: { vendorPayout: true },
          _count: { _all: true },
        }),
        prisma.payout.aggregate({ where: { status: "PAID" }, _sum: { netAmount: true } }),
      ]);

      const vendors = await prisma.vendor.findMany({
        where: { id: { in: owing.map((o) => o.vendorId) } },
        select: { id: true, businessName: true },
      });

      return {
        payouts,
        owing: owing.map((o) => ({
          vendorId: o.vendorId,
          businessName:
            vendors.find((v) => v.id === o.vendorId)?.businessName ?? "Unknown vendor",
          amount: Number(o._sum?.vendorPayout ?? 0),
          count: o._count?._all ?? 0,
        })),
        settledTotal: Number(settled._sum?.netAmount ?? 0),
      };
    },
  },

  earnings: {
    roles: ["VENDOR"],
    load: async ({ actor }) => {
      const vendorId = actor.vendorId!;
      const [commissions, totals, payouts] = await Promise.all([
        prisma.commission.findMany({
          where: { vendorId },
          orderBy: { createdAt: "desc" },
          take: 60,
          select: {
            id: true, rate: true, baseAmount: true, amount: true,
            vendorPayout: true, status: true, earnedAt: true, createdAt: true,
            booking: {
              select: {
                id: true, reference: true, checkOut: true,
                property: { select: { name: true } },
              },
            },
          },
        }),
        prisma.commission.groupBy({
          by: ["status"],
          where: { vendorId },
          _sum: { vendorPayout: true, amount: true, baseAmount: true },
        }),
        prisma.payout.findMany({
          where: { vendorId },
          orderBy: { createdAt: "desc" },
          take: 12,
        }),
      ]);
      return {
        commissions,
        byStatus: Object.fromEntries(
          totals.map((t) => [
            t.status,
            {
              payout: Number(t._sum?.vendorPayout ?? 0),
              commission: Number(t._sum?.amount ?? 0),
              base: Number(t._sum?.baseAmount ?? 0),
            },
          ]),
        ),
        payouts,
      };
    },
  },

  /* ------------------------------------------------------------ catalogue */
  "coupons/detail": {
    roles: ["ADMIN"],
    load: async ({ id }) => prisma.coupon.findUniqueOrThrow({ where: { id: id! } }),
  },

  coupons: {
    roles: ["ADMIN"],
    load: async () =>
      prisma.coupon.findMany({
            orderBy: [{ isActive: "desc" }, { endsAt: "desc" }],
            select: {
              id: true, code: true, description: true, type: true, value: true,
              maxDiscount: true, minSpend: true, usageLimit: true, usageCount: true,
              startsAt: true, endsAt: true, isActive: true,
              _count: { select: { bookings: true } },
            },
          }),
  },

  "banners/detail": {
    roles: ["ADMIN"],
    load: async ({ id }) => prisma.banner.findUniqueOrThrow({ where: { id: id! } }),
  },

  banners: {
    roles: ["ADMIN"],
    load: async () =>
      prisma.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] }),
  },

  "destinations/detail": {
    roles: ["ADMIN"],
    load: async ({ id }) => {
      const [divisions, district] = await Promise.all([
        prisma.division.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
        prisma.district.findUnique({ where: { id: id! } }),
      ]);
      if (!district) throw new Error("Destination not found");
      return { divisions, district };
    },
  },

  destinations: {
    roles: ["ADMIN"],
    load: async () => {
      const divisions = await prisma.division.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
      const districts = await prisma.district.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true, name: true, slug: true, tagline: true, imageUrl: true,
          isPopular: true, isActive: true,
          division: { select: { name: true } },
          _count: { select: { properties: true, areas: true } },
        },
      });
      return { divisions, districts };
    },
  },

  areas: {
    roles: ["ADMIN"],
    load: async () => {
      const [areas, districts] = await Promise.all([
        prisma.area.findMany({
          orderBy: [{ district: { name: "asc" } }, { name: "asc" }],
          select: {
            id: true, name: true, slug: true, isActive: true,
            district: { select: { name: true } },
            _count: { select: { properties: true } },
          },
        }),
        prisma.district.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      ]);
      return { areas, districts };
    },
  },

  "property-types/detail": {
    roles: ["ADMIN"],
    load: async ({ id }) => prisma.propertyType.findUniqueOrThrow({ where: { id: id! } }),
  },

  "property-types": {
    roles: ["ADMIN"],
    load: async () =>
      prisma.propertyType.findMany({
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
              id: true, name: true, slug: true, icon: true, sortOrder: true,
              isActive: true, _count: { select: { properties: true } },
            },
          }),
  },

  "amenities/detail": {
    roles: ["ADMIN"],
    load: async ({ id }) => prisma.amenity.findUniqueOrThrow({ where: { id: id! } }),
  },

  amenities: {
    roles: ["ADMIN"],
    load: async () =>
      prisma.amenity.findMany({
            orderBy: { name: "asc" },
            select: {
              id: true, name: true, slug: true, icon: true, category: true,
              isFilter: true, _count: { select: { properties: true, rooms: true } },
            },
          }),
  },

  "pages/detail": {
    roles: ["ADMIN"],
    load: async ({ id }) => prisma.contentPage.findUniqueOrThrow({ where: { id: id! } }),
  },

  pages: {
    roles: ["ADMIN"],
    load: async () => prisma.contentPage.findMany({ orderBy: { updatedAt: "desc" } }),
  },

  /* -------------------------------------------------------------- content */
  reviews: {
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    load: async ({ actor, searchParams }) => {
      const filter = one(searchParams, "status");
      const scope: Prisma.ReviewWhereInput =
        actor.role === "ADMIN"
          ? {}
          : actor.role === "VENDOR"
            ? { property: vendorScope(actor) }
            : { userId: actor.id };

      const reviews = await prisma.review.findMany({
        where: {
          ...scope,
          ...(filter === "pending" ? { isApproved: false } : {}),
          ...(filter === "approved" ? { isApproved: true } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true, rating: true, title: true, comment: true, isApproved: true,
          vendorReply: true, createdAt: true,
          user: { select: { name: true } },
          property: { select: { name: true, slug: true, district: { select: { slug: true } } } },
          booking: { select: { reference: true, items: { select: { roomName: true }, take: 1 } } },
        },
      });

      // Customers can review any completed stay they haven't yet reviewed.
      const reviewable =
        actor.role === "CUSTOMER"
          ? await prisma.booking.findMany({
              where: { userId: actor.id, status: "COMPLETED", review: { is: null } },
              select: {
                id: true, reference: true, checkOut: true,
                property: { select: { name: true } },
              },
            })
          : [];

      return { reviews, reviewable, role: actor.role };
    },
  },

  wishlist: {
    roles: ["CUSTOMER"],
    load: async ({ actor }) =>
      prisma.wishlistItem.findMany({
        where: { userId: actor.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, propertyId: true,
          property: {
            select: {
              id: true, name: true, slug: true, basePrice: true, ratingAvg: true,
              ratingCount: true, status: true, shortDescription: true, category: true,
              type: { select: { name: true } },
              district: { select: { name: true, slug: true } },
              images: { where: { isCover: true }, take: 1, select: { url: true, alt: true } },
            },
          },
        },
      }),
  },

  offers: {
    roles: ["VENDOR"],
    load: async ({ actor }) =>
      prisma.room.findMany({
        where: { property: vendorScope(actor) },
        orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
        select: {
          id: true, name: true, basePrice: true, discountValue: true,
          property: { select: { name: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
        },
      }),
  },

  availability: {
    roles: ["ADMIN", "VENDOR"],
    load: async ({ actor, searchParams }) => {
      const rooms = await prisma.room.findMany({
        where: actor.role === "ADMIN" ? {} : { property: vendorScope(actor) },
        orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
        select: { id: true, name: true, totalUnits: true, property: { select: { name: true } } },
      });

      const roomId = one(searchParams, "room") ?? rooms[0]?.id;
      if (!roomId) return { rooms, roomId: null, nights: [] };

      // Confirm the room belongs to the caller before returning its calendar.
      const owned = rooms.some((r) => r.id === roomId);
      if (!owned) throw new Error("You don't have access to that room");

      const from = new Date();
      from.setUTCHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setUTCDate(to.getUTCDate() + 42);

      const nights = await prisma.roomAvailability.findMany({
        where: { roomId, date: { gte: from, lt: to } },
        orderBy: { date: "asc" },
        select: { id: true, date: true, unitsOpen: true, price: true, isClosed: true },
      });
      return { rooms, roomId, nights };
    },
  },

  /* ------------------------------------------------------------- settings */
  settings: {
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    // Vendor details are nested under the user, matching how the form reads them.
    load: async ({ actor }) =>
      prisma.user.findUniqueOrThrow({
        where: { id: actor.id },
        select: {
          id: true, name: true, email: true, phone: true, avatarUrl: true, role: true,
          vendor: {
            select: {
              id: true, businessName: true, contactEmail: true, contactPhone: true,
              address: true, tradeLicenseNo: true, tinNumber: true, bankName: true,
              bankAccountName: true, bankAccountNo: true, status: true,
              commissionRate: true,
            },
          },
        },
      }),
  },
} satisfies Record<string, Resource>;

export type ResourceName = keyof typeof RESOURCES;

/** The exact payload a resource returns, for the view that renders it. */
export type ResourceData<K extends ResourceName> = Awaited<
  ReturnType<(typeof RESOURCES)[K]["load"]>
>;

export const isResource = (name: string): name is ResourceName =>
  Object.hasOwn(RESOURCES, name);
