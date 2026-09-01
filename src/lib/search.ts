import { PROPERTIES, lowestRate } from "./properties";
import type { Property, SortKey } from "./types";

export interface SearchQuery {
  destination?: string;
  type?: string[];
  category?: string[];
  amenities?: string[];
  minPrice?: number;
  maxPrice?: number;
  stars?: number[];
  minRating?: number;
  sort?: SortKey;
  page?: number;
}

export const PRICE_FLOOR = 1000;
export const PRICE_CEILING = 25000;
export const PAGE_SIZE = 6;

/** Reads the URL search params Next hands a page into a typed query. */
export function parseSearchQuery(
  sp: Record<string, string | string[] | undefined>,
): SearchQuery {
  const many = (v: string | string[] | undefined) =>
    v === undefined ? undefined : Array.isArray(v) ? v : v.split(",").filter(Boolean);
  const num = (v: string | string[] | undefined) => {
    const raw = Array.isArray(v) ? v[0] : v;
    if (raw === undefined || raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    destination: Array.isArray(sp.destination) ? sp.destination[0] : sp.destination,
    type: many(sp.type),
    category: many(sp.category),
    amenities: many(sp.amenities),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    stars: many(sp.stars)?.map(Number).filter(Number.isFinite),
    minRating: num(sp.minRating),
    sort: (Array.isArray(sp.sort) ? sp.sort[0] : sp.sort) as SortKey | undefined,
    page: num(sp.page),
  };
}

export function filterProperties(q: SearchQuery): Property[] {
  return PROPERTIES.filter((p) => {
    if (q.destination && p.destinationSlug !== q.destination) return false;
    if (q.type?.length && !q.type.includes(p.type)) return false;
    if (q.category?.length && !q.category.includes(p.category)) return false;
    if (q.stars?.length && !q.stars.includes(p.starRating)) return false;
    if (q.minRating !== undefined && p.ratingAvg < q.minRating) return false;

    // Price filters compare against the rate the guest would actually pay.
    const rate = lowestRate(p);
    if (q.minPrice !== undefined && rate < q.minPrice) return false;
    if (q.maxPrice !== undefined && rate > q.maxPrice) return false;

    if (q.amenities?.length && !q.amenities.every((a) => p.amenities.includes(a)))
      return false;

    return true;
  });
}

export function sortProperties(list: Property[], sort: SortKey = "recommended") {
  const out = [...list];
  switch (sort) {
    case "price-asc":
      return out.sort((a, b) => lowestRate(a) - lowestRate(b));
    case "price-desc":
      return out.sort((a, b) => lowestRate(b) - lowestRate(a));
    case "top-rated":
      return out.sort((a, b) => b.ratingAvg - a.ratingAvg);
    case "most-booked":
      return out.sort((a, b) => b.ratingCount - a.ratingCount);
    case "newest":
      // Newest listings first — ids are assigned in creation order.
      return out.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
    case "featured":
      return out.sort(
        (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.ratingAvg - a.ratingAvg,
      );
    case "recommended":
    default:
      // Featured and premium float up, then rating, then review volume.
      return out.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          Number(b.isPremium) - Number(a.isPremium) ||
          b.ratingAvg - a.ratingAvg ||
          b.ratingCount - a.ratingCount,
      );
  }
}

/** How many results each filter value would return, for the facet counts. */
export function facetCounts(q: SearchQuery) {
  const base = { ...q, type: undefined, category: undefined, amenities: undefined };
  const pool = filterProperties(base);
  const count = (pred: (p: Property) => boolean) => pool.filter(pred).length;
  return {
    type: (slug: string) => count((p) => p.type === slug),
    category: (slug: string) => count((p) => p.category === slug),
    amenity: (slug: string) => count((p) => p.amenities.includes(slug)),
  };
}
