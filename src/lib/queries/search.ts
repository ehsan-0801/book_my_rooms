import "server-only";

import { prisma } from "@/lib/prisma";
import { PUBLIC_PROPERTY_WHERE, cardSelect, mapCard } from "./storefront";
import type { SearchQuery } from "@/lib/search";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 6;

/**
 * Translates the URL query into a Prisma `where`.
 *
 * Filtering happens in SQL rather than in memory so the page stays fast as the
 * catalogue grows (SRS §63) — the schema indexes districtId+status, status+
 * isFeatured, basePrice and ratingAvg to support exactly these predicates.
 */
function buildWhere(q: SearchQuery): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { ...PUBLIC_PROPERTY_WHERE };

  if (q.destination) where.district = { slug: q.destination };
  if (q.type?.length) where.type = { slug: { in: q.type } };
  if (q.category?.length) {
    where.category = {
      in: q.category.map((c) => c.toUpperCase()) as Prisma.EnumPropertyCategoryFilter["in"],
    };
  }
  if (q.stars?.length) where.starRating = { in: q.stars };
  if (q.minRating !== undefined) where.ratingAvg = { gte: q.minRating };

  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    where.basePrice = {
      ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
      ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {}),
    };
  }

  // Every selected amenity must be present, so each becomes its own `some`.
  if (q.amenities?.length) {
    where.AND = q.amenities.map((slug) => ({
      amenities: { some: { amenity: { slug } } },
    }));
  }

  if (q.text) {
    where.OR = [
      { name: { contains: q.text, mode: "insensitive" } },
      { shortDescription: { contains: q.text, mode: "insensitive" } },
      { district: { name: { contains: q.text, mode: "insensitive" } } },
      { area: { name: { contains: q.text, mode: "insensitive" } } },
    ];
  }

  return where;
}

function buildOrderBy(sort: SearchQuery["sort"]): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ basePrice: "asc" }];
    case "price-desc":
      return [{ basePrice: "desc" }];
    case "top-rated":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "most-booked":
      return [{ bookingCount: "desc" }, { ratingCount: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "featured":
      return [{ isFeatured: "desc" }, { ratingAvg: "desc" }];
    case "recommended":
    default:
      // Featured and premium float up, then rating, then review volume.
      return [
        { isFeatured: "desc" },
        { isPremium: "desc" },
        { ratingAvg: "desc" },
        { ratingCount: "desc" },
      ];
  }
}

export async function searchProperties(q: SearchQuery) {
  const where = buildWhere(q);
  const page = Math.max(1, q.page ?? 1);

  const [total, rows] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy: buildOrderBy(q.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: cardSelect,
    }),
  ]);

  return {
    properties: rows.map(mapCard),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/**
 * Counts for the filter sidebar.
 *
 * Each facet is counted against the query *without* its own dimension applied,
 * so ticking "Resort" doesn't zero out every other property type.
 */
export async function getFacetCounts(q: SearchQuery) {
  const typeBase = buildWhere({ ...q, type: undefined, page: undefined });
  const categoryBase = buildWhere({ ...q, category: undefined, page: undefined });
  const amenityBase = buildWhere({ ...q, amenities: undefined, page: undefined });

  const [byType, byCategory, amenityRows] = await Promise.all([
    prisma.property.groupBy({
      by: ["typeId"],
      where: typeBase,
      _count: { _all: true },
    }),
    prisma.property.groupBy({
      by: ["category"],
      where: categoryBase,
      _count: { _all: true },
    }),
    prisma.propertyAmenity.groupBy({
      by: ["amenityId"],
      where: { property: amenityBase },
      _count: { _all: true },
    }),
  ]);

  const [types, amenities] = await Promise.all([
    prisma.propertyType.findMany({ select: { id: true, slug: true } }),
    prisma.amenity.findMany({ where: { isFilter: true }, select: { id: true, slug: true } }),
  ]);

  const typeSlug = new Map(types.map((t) => [t.id, t.slug]));
  const amenitySlug = new Map(amenities.map((a) => [a.id, a.slug]));

  return {
    type: Object.fromEntries(
      byType.map((r) => [typeSlug.get(r.typeId) ?? r.typeId, r._count?._all ?? 0]),
    ) as Record<string, number>,
    category: Object.fromEntries(
      byCategory.map((r) => [r.category.toLowerCase(), r._count?._all ?? 0]),
    ) as Record<string, number>,
    amenity: Object.fromEntries(
      amenityRows
        .filter((r) => amenitySlug.has(r.amenityId))
        .map((r) => [amenitySlug.get(r.amenityId)!, r._count?._all ?? 0]),
    ) as Record<string, number>,
  };
}
