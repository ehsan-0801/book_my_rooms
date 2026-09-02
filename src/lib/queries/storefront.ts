import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  AmenityRef,
  Destination,
  Property,
  PropertyCategory,
  PropertyTypeSlug,
  Review,
  Room,
  SortKey,
} from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";

/**
 * The single visibility rule for the public site: a listing is only reachable
 * once it is PUBLISHED *and* its vendor is APPROVED (SRS §81.1–81.3).
 *
 * Every storefront query spreads this, so unpublishing a property or
 * suspending a vendor removes their listings everywhere at once.
 */
export const PUBLIC_PROPERTY_WHERE = {
  status: "PUBLISHED",
  vendor: { status: "APPROVED" },
} satisfies Prisma.PropertyWhereInput;

/* ------------------------------------------------------------- selections */

const amenityRefSelect = {
  select: { slug: true, name: true, icon: true },
} satisfies Prisma.AmenityDefaultArgs;

/** Everything a listing card needs — deliberately excludes rooms and reviews. */
const cardSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  shortDescription: true,
  addressLine: true,
  starRating: true,
  ratingAvg: true,
  ratingCount: true,
  basePrice: true,
  isFeatured: true,
  isPremium: true,
  checkInTime: true,
  checkOutTime: true,
  latitude: true,
  longitude: true,
  contactPhone: true,
  contactEmail: true,
  type: { select: { slug: true, name: true } },
  district: { select: { slug: true, name: true } },
  area: { select: { name: true } },
  images: {
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
    select: { url: true, alt: true },
  },
  amenities: { select: { amenity: amenityRefSelect } },
  rooms: {
    where: { isActive: true },
    select: { basePrice: true, discountValue: true },
  },
} satisfies Prisma.PropertySelect;

/** The card fields plus everything the detail page renders. */
const detailSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  shortDescription: true,
  description: true,
  addressLine: true,
  starRating: true,
  ratingAvg: true,
  ratingCount: true,
  basePrice: true,
  isFeatured: true,
  isPremium: true,
  checkInTime: true,
  checkOutTime: true,
  latitude: true,
  longitude: true,
  contactPhone: true,
  contactEmail: true,
  policies: true,
  rules: true,
  cancellationPolicy: true,
  type: { select: { slug: true, name: true } },
  district: { select: { slug: true, name: true } },
  area: { select: { name: true } },
  images: {
    orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
    select: { url: true, alt: true },
  },
  amenities: { select: { amenity: amenityRefSelect } },
  rooms: {
    where: { isActive: true },
    orderBy: { basePrice: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      maxGuests: true,
      maxAdults: true,
      maxChildren: true,
      bedType: true,
      sizeSqft: true,
      totalUnits: true,
      basePrice: true,
      discountValue: true,
      isRefundable: true,
      breakfastIncluded: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
      amenities: { select: { amenity: amenityRefSelect } },
    },
  },
  attractions: {
    orderBy: { distanceKm: "asc" },
    select: { name: true, category: true, distanceKm: true },
  },
  reviews: {
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      createdAt: true,
      vendorReply: true,
      user: { select: { name: true } },
      booking: { select: { items: { select: { roomName: true }, take: 1 } } },
    },
  },
} satisfies Prisma.PropertySelect;

type CardRow = Prisma.PropertyGetPayload<{ select: typeof cardSelect }>;
type DetailRow = Prisma.PropertyGetPayload<{ select: typeof detailSelect }>;

/* ---------------------------------------------------------------- mappers */

const toAmenity = (a: { slug: string; name: string; icon: string | null }): AmenityRef => ({
  slug: a.slug,
  name: a.name,
  icon: a.icon,
});

/** Splits the newline-delimited text the vendor forms write back into a list. */
const toLines = (value: string | null) =>
  (value ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

const discountOf = (rooms: { discountValue: Prisma.Decimal | null }[]) => {
  const best = Math.max(0, ...rooms.map((r) => Number(r.discountValue ?? 0)));
  return best > 0 ? best : undefined;
};

function mapCard(row: CardRow): Property {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type.slug as PropertyTypeSlug,
    typeLabel: row.type.name,
    category: row.category.toLowerCase() as PropertyCategory,
    destinationSlug: row.district.slug,
    district: row.district.name,
    area: row.area?.name ?? row.district.name,
    addressLine: row.addressLine,
    contactPhone: row.contactPhone ?? undefined,
    contactEmail: row.contactEmail ?? undefined,
    shortDescription: row.shortDescription ?? "",
    description: "",
    images: row.images.map((i) => ({ url: i.url, alt: i.alt ?? row.name })),
    starRating: row.starRating ?? 0,
    ratingAvg: Number(row.ratingAvg),
    ratingCount: row.ratingCount,
    basePrice: Number(row.basePrice),
    discountPercent: discountOf(row.rooms),
    isFeatured: row.isFeatured,
    isPremium: row.isPremium,
    amenities: row.amenities.map((a) => toAmenity(a.amenity)),
    rooms: [],
    reviews: [],
    nearby: [],
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    policies: [],
    rules: [],
    cancellationPolicy: "",
    coords: { lat: row.latitude ?? 0, lng: row.longitude ?? 0 },
  };
}

function mapDetail(row: DetailRow): Property {
  const rooms: Room[] = row.rooms.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    image: {
      url: r.images[0]?.url ?? row.images[0]?.url ?? "",
      alt: r.images[0]?.alt ?? r.name,
    },
    maxGuests: r.maxGuests,
    maxAdults: r.maxAdults,
    maxChildren: r.maxChildren,
    bedType: r.bedType ?? "",
    sizeSqft: r.sizeSqft ?? 0,
    // Availability is per-night; the card shows the room's own stock until a
    // date range is chosen.
    unitsLeft: r.totalUnits,
    basePrice: Number(r.basePrice),
    discountPercent: r.discountValue ? Number(r.discountValue) : undefined,
    breakfastIncluded: r.breakfastIncluded,
    isRefundable: r.isRefundable,
    amenities: r.amenities.map((a) => toAmenity(a.amenity)),
  }));

  const reviews: Review[] = row.reviews.map((rv) => ({
    id: rv.id,
    author: rv.user.name,
    avatarInitials: rv.user.name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
    rating: rv.rating,
    title: rv.title ?? "",
    comment: rv.comment ?? "",
    date: rv.createdAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    stayedIn: rv.booking?.items[0]?.roomName ?? "",
  }));

  return {
    ...mapCard(row),
    description: row.description,
    rooms,
    reviews,
    nearby: row.attractions.map((a) => ({
      name: a.name,
      category: a.category ?? "Nearby",
      distanceKm: Number(a.distanceKm ?? 0),
    })),
    policies: toLines(row.policies),
    rules: toLines(row.rules),
    cancellationPolicy: row.cancellationPolicy ?? "",
  };
}

/* ------------------------------------------------------------------ reads */

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const row = await prisma.property.findFirst({
    where: { slug, ...PUBLIC_PROPERTY_WHERE },
    select: detailSelect,
  });
  return row ? mapDetail(row) : null;
}

/** Slugs for generateStaticParams — only what the public can actually reach. */
export async function listPublicPropertyPaths() {
  const rows = await prisma.property.findMany({
    where: PUBLIC_PROPERTY_WHERE,
    select: { slug: true, district: { select: { slug: true } } },
  });
  return rows.map((r) => ({ destination: r.district.slug, slug: r.slug }));
}

export async function getFeaturedProperties(take = 6) {
  const rows = await prisma.property.findMany({
    where: { ...PUBLIC_PROPERTY_WHERE, isFeatured: true },
    orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    take,
    select: cardSelect,
  });
  return rows.map(mapCard);
}

export async function getBudgetProperties(take = 3, maxPrice = 5500) {
  const rows = await prisma.property.findMany({
    where: { ...PUBLIC_PROPERTY_WHERE, basePrice: { lte: maxPrice } },
    orderBy: { basePrice: "asc" },
    take,
    select: cardSelect,
  });
  return rows.map(mapCard);
}

export async function getNatureProperties(take = 3) {
  const rows = await prisma.property.findMany({
    where: {
      ...PUBLIC_PROPERTY_WHERE,
      OR: [
        { type: { slug: { in: ["eco-resort", "cottage", "homestay"] } } },
        { amenities: { some: { amenity: { slug: "nature-view" } } } },
      ],
    },
    orderBy: { ratingAvg: "desc" },
    take,
    select: cardSelect,
  });
  return rows.map(mapCard);
}

/** Properties with at least one discounted room. */
export async function getDiscountedProperties(take?: number) {
  const rows = await prisma.property.findMany({
    where: {
      ...PUBLIC_PROPERTY_WHERE,
      rooms: { some: { isActive: true, discountValue: { gt: 0 } } },
    },
    orderBy: { ratingAvg: "desc" },
    take,
    select: cardSelect,
  });
  return rows
    .map(mapCard)
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
}

export async function getPropertiesInDestination(destinationSlug: string) {
  const rows = await prisma.property.findMany({
    where: { ...PUBLIC_PROPERTY_WHERE, district: { slug: destinationSlug } },
    orderBy: [{ isFeatured: "desc" }, { ratingAvg: "desc" }],
    select: cardSelect,
  });
  return rows.map(mapCard);
}

/* ----------------------------------------------------------- destinations */

function mapDestination(row: {
  slug: string;
  name: string;
  tagline: string | null;
  imageUrl: string | null;
  imageAuthor: string | null;
  imageLicense: string | null;
  imageSource: string | null;
  division: { name: string };
  _count: { properties: number };
}, fromPrice: number): Destination {
  return {
    slug: row.slug,
    name: row.name,
    division: row.division.name,
    tagline: row.tagline ?? "",
    image: row.imageUrl ?? "",
    propertyCount: row._count.properties,
    fromPrice,
    credit: {
      author: row.imageAuthor ?? "",
      license: row.imageLicense ?? "",
      source: row.imageSource ?? "",
    },
  };
}

export async function listDestinations(onlyPopular = false) {
  const rows = await prisma.district.findMany({
    where: {
      isActive: true,
      ...(onlyPopular ? { isPopular: true } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      slug: true, name: true, tagline: true, imageUrl: true,
      imageAuthor: true, imageLicense: true, imageSource: true,
      division: { select: { name: true } },
      _count: { select: { properties: { where: PUBLIC_PROPERTY_WHERE } } },
    },
  });

  // Cheapest published listing per destination, for the "from ৳x" line.
  const cheapest = await prisma.property.groupBy({
    by: ["districtId"],
    where: PUBLIC_PROPERTY_WHERE,
    _min: { basePrice: true },
  });
  const districts = await prisma.district.findMany({
    where: { slug: { in: rows.map((r) => r.slug) } },
    select: { id: true, slug: true },
  });
  const idToSlug = new Map(districts.map((d) => [d.id, d.slug]));
  const priceBySlug = new Map(
    cheapest.map((c) => [idToSlug.get(c.districtId), Number(c._min?.basePrice ?? 0)]),
  );

  return rows.map((r) => mapDestination(r, priceBySlug.get(r.slug) ?? 0));
}

export async function getDestination(slug: string) {
  const row = await prisma.district.findFirst({
    where: { slug, isActive: true },
    select: {
      slug: true, name: true, tagline: true, imageUrl: true,
      imageAuthor: true, imageLicense: true, imageSource: true,
      division: { select: { name: true } },
      _count: { select: { properties: { where: PUBLIC_PROPERTY_WHERE } } },
    },
  });
  if (!row) return null;

  const cheapest = await prisma.property.aggregate({
    where: { ...PUBLIC_PROPERTY_WHERE, district: { slug } },
    _min: { basePrice: true },
  });
  return mapDestination(row, Number(cheapest._min?.basePrice ?? 0));
}

/* ---------------------------------------------------------------- reviews */

/** Five-star approved reviews for the homepage rail. */
export async function getShowcaseReviews(take = 3) {
  const rows = await prisma.review.findMany({
    where: { isApproved: true, rating: 5, property: PUBLIC_PROPERTY_WHERE },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true, rating: true, title: true, comment: true, createdAt: true,
      user: { select: { name: true } },
      property: {
        select: { name: true, slug: true, district: { select: { slug: true, name: true } } },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    author: r.user.name,
    avatarInitials: r.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
    rating: r.rating,
    title: r.title ?? "",
    comment: r.comment ?? "",
    date: r.createdAt.toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }),
    stayedIn: "",
    propertyName: r.property.name,
    propertySlug: r.property.slug,
    destinationSlug: r.property.district.slug,
    district: r.property.district.name,
  }));
}

/* ----------------------------------------------------------- taxonomy */

export async function listPropertyTypes() {
  return prisma.propertyType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, icon: true },
  });
}

export async function listFilterAmenities() {
  return prisma.amenity.findMany({
    where: { isFilter: true },
    orderBy: { name: "asc" },
    select: { slug: true, name: true, icon: true },
  });
}

export { mapCard, cardSelect, type SortKey };
