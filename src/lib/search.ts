import type { SortKey } from "./types";

/**
 * URL <-> query parsing for the search page.
 *
 * The filtering itself lives in `queries/search.ts` and runs in SQL; this file
 * only turns search params into a typed object both the page and the query
 * layer agree on.
 */
export interface SearchQuery {
  destination?: string;
  /** Free-text query across property name, area and destination. */
  text?: string;
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

/** Reads the URL search params Next hands a page into a typed query. */
export function parseSearchQuery(
  sp: Record<string, string | string[] | undefined>,
): SearchQuery {
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const many = (v: string | string[] | undefined) =>
    v === undefined
      ? undefined
      : Array.isArray(v)
        ? v
        : v.split(",").filter(Boolean);

  const num = (v: string | string[] | undefined) => {
    const raw = one(v);
    if (raw === undefined || raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    destination: one(sp.destination),
    text: one(sp.q) || undefined,
    type: many(sp.type),
    category: many(sp.category),
    amenities: many(sp.amenities),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    stars: many(sp.stars)?.map(Number).filter(Number.isFinite),
    minRating: num(sp.minRating),
    sort: one(sp.sort) as SortKey | undefined,
    page: num(sp.page),
  };
}

/** How many filter dimensions the user has narrowed by — drives the badge. */
export function countActiveFilters(q: SearchQuery) {
  return (
    (q.type?.length ?? 0) +
    (q.category?.length ?? 0) +
    (q.amenities?.length ?? 0) +
    (q.stars?.length ?? 0) +
    (q.minPrice !== undefined || q.maxPrice !== undefined ? 1 : 0)
  );
}
