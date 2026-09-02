/**
 * Seeds the marketplace with the catalogue the storefront prototype used, plus
 * the users, bookings and ledger rows the vendor/admin dashboards need.
 *
 * Idempotent: every write is an upsert keyed on a natural unique column, so
 * re-running only refreshes data.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { DESTINATIONS } from "./fixtures/destinations";
import { PROPERTIES } from "./fixtures/properties";
import { AMENITIES, PROPERTY_TYPES } from "./fixtures/taxonomy";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const PASSWORD = "Password@123";

/** Deterministic pseudo-random so re-seeding produces the same numbers. */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rnd = makeRng(20260901);
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const TODAY = (() => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
})();

async function main() {
  console.log("→ Seeding Book My Rooms\n");

  // ------------------------------------------------------------ geography
  const divisionNames = [...new Set(DESTINATIONS.map((d) => d.division))];
  const divisions = new Map<string, string>();
  for (const name of divisionNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const row = await prisma.division.upsert({
      where: { name },
      update: { slug },
      create: { name, slug },
    });
    divisions.set(name, row.id);
  }
  console.log(`  divisions      ${divisions.size}`);

  // Districts are the customer-facing "destinations".
  const districts = new Map<string, string>();
  for (const d of DESTINATIONS) {
    const row = await prisma.district.upsert({
      where: { slug: d.slug },
      update: {
        name: d.name,
        imageUrl: d.image,
        tagline: d.tagline,
        isPopular: true,
        divisionId: divisions.get(d.division)!,
        imageAuthor: d.credit.author,
        imageLicense: d.credit.license,
        imageSource: d.credit.source,
      },
      create: {
        slug: d.slug,
        name: d.name,
        imageUrl: d.image,
        tagline: d.tagline,
        isPopular: true,
        divisionId: divisions.get(d.division)!,
        imageAuthor: d.credit.author,
        imageLicense: d.credit.license,
        imageSource: d.credit.source,
      },
    });
    districts.set(d.slug, row.id);
  }
  console.log(`  districts      ${districts.size}`);

  // Areas come from the properties themselves.
  const areas = new Map<string, string>();
  for (const p of PROPERTIES) {
    const districtId = districts.get(p.destinationSlug)!;
    const slug = p.area.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const key = `${p.destinationSlug}:${slug}`;
    if (areas.has(key)) continue;
    const row = await prisma.area.upsert({
      where: { districtId_slug: { districtId, slug } },
      update: { name: p.area },
      create: { districtId, slug, name: p.area },
    });
    areas.set(key, row.id);
  }
  console.log(`  areas          ${areas.size}`);

  // ------------------------------------------------------------ taxonomy
  const types = new Map<string, string>();
  for (const [i, t] of PROPERTY_TYPES.entries()) {
    const row = await prisma.propertyType.upsert({
      where: { slug: t.slug },
      update: { name: t.label, icon: t.icon, sortOrder: i },
      create: { slug: t.slug, name: t.label, icon: t.icon, sortOrder: i },
    });
    types.set(t.slug, row.id);
  }

  const FILTERABLE = new Set([
    "ac", "swimming-pool", "free-breakfast", "couple-friendly", "family-friendly",
    "wifi", "parking", "pet-friendly", "nature-view",
  ]);
  const amenities = new Map<string, string>();
  for (const a of AMENITIES) {
    const row = await prisma.amenity.upsert({
      where: { slug: a.slug },
      update: { name: a.name, icon: a.icon, isFilter: FILTERABLE.has(a.slug) },
      create: {
        slug: a.slug, name: a.name, icon: a.icon, isFilter: FILTERABLE.has(a.slug),
      },
    });
    amenities.set(a.slug, row.id);
  }
  console.log(`  types/amenity  ${types.size}/${amenities.size}`);

  // ------------------------------------------------------------ users
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: "admin@bookmyrooms.com.bd" },
    update: { role: "ADMIN", passwordHash },
    create: {
      name: "Platform Admin",
      email: "admin@bookmyrooms.com.bd",
      phone: "01700000001",
      role: "ADMIN",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  // Each vendor owns the properties of one or two destinations.
  const VENDOR_DEFS = [
    { biz: "Sea Pearl Hospitality Ltd.", email: "vendor.seapearl@bookmyrooms.com.bd", owner: "Rezaul Karim", phone: "01711000101", slugs: ["sea-pearl-beach-resort-spa", "sayeman-beach-resort", "ocean-paradise-hotel"], rate: 12, status: "APPROVED" as const },
    { biz: "Hill Tracts Retreats", email: "vendor.hilltracts@bookmyrooms.com.bd", owner: "Aung Shwe Marma", phone: "01711000102", slugs: ["nilgiri-hill-resort", "hillside-retreat-bandarban", "cliff-camp-sajek"], rate: 15, status: "APPROVED" as const },
    { biz: "Green Leaf Estates", email: "vendor.greenleaf@bookmyrooms.com.bd", owner: "Shamima Nasrin", phone: "01711000103", slugs: ["tea-estate-cottage-sreemangal", "lawachara-eco-villa", "royal-tulip-sylhet", "courtyard-boutique-sylhet"], rate: 15, status: "APPROVED" as const },
    { biz: "Coastal Stays BD", email: "vendor.coastal@bookmyrooms.com.bd", owner: "Jahangir Alam", phone: "01711000104", slugs: ["coral-lagoon-cabanas", "palm-grove-resort-kuakata"], rate: 18, status: "APPROVED" as const },
    { biz: "Padma View Resorts", email: "vendor.padma@bookmyrooms.com.bd", owner: "Nazmul Huda", phone: "01711000105", slugs: [], rate: 15, status: "PENDING" as const },
    { biz: "Haor Bari Homestays", email: "vendor.haor@bookmyrooms.com.bd", owner: "Rokeya Begum", phone: "01711000106", slugs: [], rate: 15, status: "PENDING" as const },
  ];

  const vendorBySlug = new Map<string, string>();
  for (const v of VENDOR_DEFS) {
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: { role: "VENDOR", passwordHash },
      create: {
        name: v.owner, email: v.email, phone: v.phone,
        role: "VENDOR", passwordHash, emailVerified: new Date(),
      },
    });
    const slug = v.biz.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const vendor = await prisma.vendor.upsert({
      where: { userId: user.id },
      update: { status: v.status, commissionRate: v.rate },
      create: {
        userId: user.id, businessName: v.biz, slug,
        contactEmail: v.email, contactPhone: v.phone,
        status: v.status, commissionRate: v.rate,
        tradeLicenseNo: `TRAD/DHA/${int(100000, 999999)}`,
        tinNumber: String(int(100000000000, 999999999999)),
        bankName: pick(["BRAC Bank", "City Bank", "Eastern Bank", "Dutch-Bangla Bank"]),
        bankAccountName: v.biz,
        bankAccountNo: String(int(10000000000, 99999999999)),
        approvedAt: v.status === "APPROVED" ? addDays(TODAY, -int(60, 400)) : null,
      },
    });
    for (const s of v.slugs) vendorBySlug.set(s, vendor.id);
  }
  console.log(`  vendors        ${VENDOR_DEFS.length}`);

  const CUSTOMER_DEFS = [
    { name: "Nusrat Jahan", email: "nusrat@example.com", phone: "01811000201" },
    { name: "Arif Hossain", email: "arif@example.com", phone: "01811000202" },
    { name: "Tanvir Ahmed", email: "tanvir@example.com", phone: "01811000203" },
    { name: "Sadia Afrin", email: "sadia@example.com", phone: "01811000204" },
    { name: "Mehedi Hasan", email: "mehedi@example.com", phone: "01811000205" },
    { name: "Zarin Tasnim", email: "zarin@example.com", phone: "01811000206" },
  ];
  const customers = [];
  for (const c of CUSTOMER_DEFS) {
    customers.push(
      await prisma.user.upsert({
        where: { email: c.email },
        update: { passwordHash },
        create: { ...c, role: "CUSTOMER", passwordHash, emailVerified: new Date() },
      }),
    );
  }
  console.log(`  customers      ${customers.length}`);

  // ------------------------------------------------------------ properties
  const roomIdBySlug = new Map<string, string>();
  const propertyIds: { id: string; slug: string; vendorId: string }[] = [];

  for (const p of PROPERTIES) {
    const vendorId = vendorBySlug.get(p.slug);
    if (!vendorId) continue;

    const districtId = districts.get(p.destinationSlug)!;
    const areaKey = `${p.destinationSlug}:${p.area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    const data = {
      vendorId,
      typeId: types.get(p.type)!,
      districtId,
      areaId: areas.get(areaKey) ?? null,
      name: p.name,
      category: p.category.toUpperCase() as "LUXURY" | "STANDARD" | "BUDGET",
      shortDescription: p.shortDescription,
      description: p.description,
      addressLine: p.addressLine,
      latitude: p.coords.lat,
      longitude: p.coords.lng,
      contactPhone: `0181${int(1000000, 9999999)}`,
      contactEmail: `reservations@${p.slug.split("-").slice(0, 2).join("")}.com.bd`,
      starRating: p.starRating,
      checkInTime: p.checkInTime,
      checkOutTime: p.checkOutTime,
      policies: p.policies.join("\n"),
      rules: p.rules.join("\n"),
      cancellationPolicy: p.cancellationPolicy,
      status: "PUBLISHED" as const,
      isFeatured: p.isFeatured,
      isPremium: p.isPremium,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      basePrice: Math.min(...p.rooms.map((r) => r.basePrice)),
      metaTitle: `${p.name}, ${p.district} — Book My Rooms`,
      metaDescription: p.shortDescription,
    };

    const property = await prisma.property.upsert({
      where: { slug: p.slug },
      update: data,
      create: { ...data, slug: p.slug },
    });
    propertyIds.push({ id: property.id, slug: p.slug, vendorId });

    // Images / amenities / attractions are fully replaced on re-seed.
    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } });
    await prisma.propertyImage.createMany({
      data: p.images.map((img, i) => ({
        propertyId: property.id, url: img.url, alt: img.alt,
        sortOrder: i, isCover: i === 0,
      })),
    });

    await prisma.propertyAmenity.deleteMany({ where: { propertyId: property.id } });
    await prisma.propertyAmenity.createMany({
      data: p.amenities
        .filter((a) => amenities.has(a))
        .map((a) => ({ propertyId: property.id, amenityId: amenities.get(a)! })),
      skipDuplicates: true,
    });

    await prisma.nearbyAttraction.deleteMany({ where: { propertyId: property.id } });
    await prisma.nearbyAttraction.createMany({
      data: p.nearby.map((n) => ({
        propertyId: property.id, name: n.name,
        category: n.category, distanceKm: n.distanceKm,
      })),
    });

    for (const r of p.rooms) {
      const roomData = {
        propertyId: property.id,
        name: r.name,
        description: r.description,
        maxGuests: r.maxGuests,
        maxAdults: r.maxAdults,
        maxChildren: r.maxChildren,
        bedType: r.bedType,
        sizeSqft: r.sizeSqft,
        totalUnits: Math.max(r.unitsLeft, int(6, 14)),
        basePrice: r.basePrice,
        discountType: r.discountPercent ? ("PERCENTAGE" as const) : null,
        discountValue: r.discountPercent ?? null,
        isRefundable: r.isRefundable,
        breakfastIncluded: r.breakfastIncluded,
      };
      const room = await prisma.room.upsert({
        where: { propertyId_slug: { propertyId: property.id, slug: r.slug } },
        update: roomData,
        create: { ...roomData, slug: r.slug },
      });
      roomIdBySlug.set(`${p.slug}:${r.slug}`, room.id);

      await prisma.roomImage.deleteMany({ where: { roomId: room.id } });
      await prisma.roomImage.create({
        data: { roomId: room.id, url: r.image.url, alt: r.image.alt, sortOrder: 0 },
      });

      await prisma.roomAmenity.deleteMany({ where: { roomId: room.id } });
      await prisma.roomAmenity.createMany({
        data: r.amenities
          .filter((a) => amenities.has(a))
          .map((a) => ({ roomId: room.id, amenityId: amenities.get(a)! })),
        skipDuplicates: true,
      });

      // 120 nights of availability from today.
      await prisma.roomAvailability.deleteMany({ where: { roomId: room.id } });
      await prisma.roomAvailability.createMany({
        data: Array.from({ length: 120 }, (_, i) => {
          const date = addDays(TODAY, i);
          const weekend = [4, 5].includes(date.getUTCDay()); // Fri/Sat in BD
          return {
            roomId: room.id,
            date,
            unitsOpen: Math.max(0, roomData.totalUnits - int(0, 4)),
            // Weekend uplift — the dynamic pricing hook from SRS §17.
            price: weekend ? Math.round(r.basePrice * 1.2) : null,
            isClosed: false,
          };
        }),
      });
    }
  }
  console.log(`  properties     ${propertyIds.length}`);
  console.log(`  rooms          ${roomIdBySlug.size}`);

  // ------------------------------------------------------------ coupons
  const COUPONS = [
    { code: "BMR10", description: "10% off your first booking", type: "PERCENTAGE" as const, value: 10, maxDiscount: 2000, minSpend: 3000 },
    { code: "MONSOON500", description: "৳500 off monsoon stays", type: "FLAT" as const, value: 500, minSpend: 5000 },
    { code: "EIDSPECIAL", description: "15% off Eid travel", type: "PERCENTAGE" as const, value: 15, maxDiscount: 5000, minSpend: 10000 },
  ];
  for (const c of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        ...c,
        usageLimit: 500,
        usageCount: int(20, 180),
        startsAt: addDays(TODAY, -60),
        endsAt: addDays(TODAY, 120),
        isActive: true,
      },
    });
  }

  // ------------------------------------------------------------ bookings
  // Wipe transactional data so amounts stay consistent across re-seeds.
  await prisma.refund.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.payout.deleteMany();

  const allRooms = await prisma.room.findMany({
    select: {
      id: true, name: true, basePrice: true, discountValue: true,
      maxGuests: true, propertyId: true,
      property: { select: { slug: true, vendorId: true } },
    },
  });

  const vendorRates = new Map<string, number>();
  for (const v of await prisma.vendor.findMany({ select: { id: true, commissionRate: true } })) {
    vendorRates.set(v.id, Number(v.commissionRate ?? 15));
  }

  const STATUS_PLAN: { status: "COMPLETED" | "CONFIRMED" | "CANCELLED" | "PAYMENT_PENDING"; count: number }[] = [
    { status: "COMPLETED", count: 26 },
    { status: "CONFIRMED", count: 14 },
    { status: "CANCELLED", count: 5 },
    { status: "PAYMENT_PENDING", count: 3 },
  ];

  let seq = 0;
  let bookingCount = 0;
  const reviewable: { bookingId: string; propertyId: string; userId: string; roomName: string }[] = [];

  for (const plan of STATUS_PLAN) {
    for (let i = 0; i < plan.count; i++) {
      seq += 1;
      const room = pick(allRooms);
      const customer = pick(customers);
      const nights = int(1, 4);
      const units = int(1, 2);

      // Past stays for COMPLETED/CANCELLED, future for the rest.
      const offset =
        plan.status === "COMPLETED" || plan.status === "CANCELLED"
          ? -int(6, 150)
          : int(3, 70);
      const checkIn = addDays(TODAY, offset);
      const checkOut = addDays(checkIn, nights);

      const list = Number(room.basePrice);
      const pct = Number(room.discountValue ?? 0);
      const nightly = pct ? Math.round(list * (1 - pct / 100)) : list;
      const listSubtotal = list * nights * units;
      const discountTotal = listSubtotal - nightly * nights * units;
      const subtotal = listSubtotal - discountTotal;
      const taxTotal = Math.round(subtotal * 0.15);
      const grandTotal = subtotal + taxTotal;

      const paymentStatus =
        plan.status === "CANCELLED" ? "REFUNDED"
        : plan.status === "PAYMENT_PENDING" ? "UNPAID"
        : "PAID";

      const createdAt = addDays(checkIn, -int(3, 30));

      const booking = await prisma.booking.create({
        data: {
          reference: `BMR-${String(seq).padStart(4, "0")}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          userId: customer.id,
          propertyId: room.propertyId,
          checkIn,
          checkOut,
          nights,
          adults: Math.min(room.maxGuests, int(1, 3)),
          children: int(0, 2),
          roomCount: units,
          guestName: customer.name,
          guestEmail: customer.email,
          guestPhone: customer.phone ?? "01800000000",
          subtotal, discountTotal, taxTotal, grandTotal,
          status: plan.status,
          paymentStatus,
          createdAt,
          cancelledAt: plan.status === "CANCELLED" ? addDays(checkIn, -int(1, 5)) : null,
          cancelReason: plan.status === "CANCELLED" ? pick(["Change of travel plans", "Found a better rate", "Trip postponed"]) : null,
          items: {
            create: {
              roomId: room.id,
              roomName: room.name,
              units,
              nights,
              unitPrice: nightly,
              lineTotal: nightly * nights * units,
            },
          },
        },
      });
      bookingCount += 1;

      if (paymentStatus !== "UNPAID") {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            method: pick(["EPS", "BKASH", "NAGAD", "CARD"] as const),
            amount: grandTotal,
            status: paymentStatus === "REFUNDED" ? "REFUNDED" : "PAID",
            gatewayRef: `EPS${int(10000000, 99999999)}`,
            paidAt: createdAt,
          },
        });

        await prisma.invoice.create({
          data: {
            bookingId: booking.id,
            invoiceNumber: `INV-${new Date(createdAt).getUTCFullYear()}-${String(seq).padStart(5, "0")}`,
            issuedAt: createdAt,
            subtotal, discountTotal, taxTotal, grandTotal,
          },
        });
      }

      // Commission is EARNED once the stay completes, REVERSED on cancellation.
      const rate = vendorRates.get(room.property.vendorId) ?? 15;
      const commissionAmount = Math.round((subtotal * rate) / 100);
      await prisma.commission.create({
        data: {
          bookingId: booking.id,
          vendorId: room.property.vendorId,
          rate,
          baseAmount: subtotal,
          amount: commissionAmount,
          vendorPayout: subtotal - commissionAmount,
          status:
            plan.status === "COMPLETED" ? "EARNED"
            : plan.status === "CANCELLED" ? "REVERSED"
            : "PENDING",
          earnedAt: plan.status === "COMPLETED" ? checkOut : null,
          reversedAt: plan.status === "CANCELLED" ? addDays(checkIn, -1) : null,
        },
      });

      if (plan.status === "CANCELLED") {
        await prisma.refund.create({
          data: {
            bookingId: booking.id,
            amount: grandTotal,
            reason: "Cancelled within the free-cancellation window",
            status: "COMPLETED",
            gatewayRef: `RFD${int(10000000, 99999999)}`,
            requestedAt: addDays(checkIn, -int(2, 6)),
            processedAt: addDays(checkIn, -int(0, 2)),
          },
        });
      }

      if (plan.status === "COMPLETED") {
        reviewable.push({
          bookingId: booking.id,
          propertyId: room.propertyId,
          userId: customer.id,
          roomName: room.name,
        });
      }
    }
  }
  console.log(`  bookings       ${bookingCount}`);

  // ------------------------------------------------------------ reviews
  const TITLES = ["Worth every taka", "Lovely stay", "Would come back", "Great location", "Comfortable and clean", "Better than expected", "Good value"];
  const BODIES = [
    "Staff were welcoming and the room was spotless. Breakfast had proper Bangladeshi options.",
    "The location did most of the work — everything we wanted was walkable.",
    "Check-in was quick and the room was exactly as pictured. No complaints.",
    "Quiet, comfortable and well priced for the season. We'd book again.",
    "Rooms are showing a little age but everything worked and the staff were excellent.",
  ];

  let reviewCount = 0;
  for (const r of reviewable) {
    if (rnd() > 0.62) continue; // not everyone reviews
    await prisma.review.create({
      data: {
        bookingId: r.bookingId,
        propertyId: r.propertyId,
        userId: r.userId,
        rating: int(3, 5),
        title: pick(TITLES),
        comment: pick(BODIES),
        isApproved: rnd() > 0.25,
        createdAt: addDays(TODAY, -int(1, 120)),
      },
    });
    reviewCount += 1;
  }
  console.log(`  reviews        ${reviewCount}`);

  // ------------------------------------------------------------ payouts
  let payoutCount = 0;
  for (const [vendorId] of vendorRates) {
    const earned = await prisma.commission.findMany({
      where: { vendorId, status: "EARNED" },
      select: { id: true, baseAmount: true, amount: true, vendorPayout: true },
    });
    if (!earned.length) continue;

    const gross = earned.reduce((n, c) => n + Number(c.baseAmount), 0);
    const commission = earned.reduce((n, c) => n + Number(c.amount), 0);
    const payout = await prisma.payout.create({
      data: {
        vendorId,
        periodStart: addDays(TODAY, -30),
        periodEnd: addDays(TODAY, -1),
        grossAmount: gross,
        commission,
        netAmount: gross - commission,
        status: "PAID",
        reference: `PO-${int(100000, 999999)}`,
        paidAt: addDays(TODAY, -1),
      },
    });
    await prisma.commission.updateMany({
      where: { id: { in: earned.map((c) => c.id) } },
      data: { payoutId: payout.id, status: "SETTLED" },
    });
    payoutCount += 1;
  }
  console.log(`  payouts        ${payoutCount}`);

  // ------------------------------------------------------------ wishlists
  // Gives the customer panel something to show out of the box.
  await prisma.wishlistItem.deleteMany();
  const wishlistTargets = await prisma.property.findMany({
    take: 6,
    orderBy: { ratingAvg: "desc" },
    select: { id: true },
  });
  let wishlistCount = 0;
  for (const customer of customers.slice(0, 3)) {
    for (const property of wishlistTargets.slice(0, int(2, 4))) {
      await prisma.wishlistItem.upsert({
        where: {
          userId_propertyId: { userId: customer.id, propertyId: property.id },
        },
        update: {},
        create: { userId: customer.id, propertyId: property.id },
      });
      wishlistCount += 1;
    }
  }
  console.log(`  wishlists      ${wishlistCount}`);

  // ------------------------------------------------------------ marketing
  await prisma.banner.deleteMany();
  await prisma.banner.createMany({
    data: [
      { title: "Cox's Bazar monsoon sale — up to 25% off", imageUrl: "/images/destinations/coxs-bazar.jpg", linkUrl: "/destinations/coxs-bazar", position: "home_hero", sortOrder: 0, isActive: true, impressions: 18420, clicks: 962 },
      { title: "Tea country escapes from ৳1,900", imageUrl: "/images/destinations/sreemangal.jpg", linkUrl: "/destinations/sreemangal", position: "home_mid", sortOrder: 1, isActive: true, impressions: 9310, clicks: 487 },
      { title: "Saint Martin's ferry season is open", imageUrl: "/images/destinations/saint-martin.jpg", linkUrl: "/destinations/saint-martin", position: "home_mid", sortOrder: 2, isActive: false, impressions: 4102, clicks: 205 },
    ],
  });

  await prisma.contentPage.upsert({
    where: { slug: "about" },
    update: {},
    create: {
      slug: "about",
      title: "About Book My Rooms",
      body: "Book My Rooms is a multi-vendor accommodation marketplace connecting travellers with verified hotels, resorts, cottages, villas, homestays and eco-resorts across Bangladesh.",
      isPublished: true,
    },
  });

  const NEWSLETTER = ["nusrat@example.com", "arif@example.com", "tanvir@example.com", "sadia@example.com"];
  for (const email of NEWSLETTER) {
    await prisma.newsletterSubscriber.upsert({
      where: { email }, update: {}, create: { email },
    });
  }

  console.log("\n✓ Seed complete");
  console.log("\n  Sign in with password:", PASSWORD);
  console.log("  admin@bookmyrooms.com.bd            (admin)");
  console.log("  vendor.seapearl@bookmyrooms.com.bd  (vendor)");
  console.log("  nusrat@example.com                  (customer)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
