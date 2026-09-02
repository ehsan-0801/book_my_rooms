/**
 * Static UI constants.
 *
 * Property types and amenities are admin-editable rows, so they are read from
 * the database (see `queries/storefront.ts`) rather than hardcoded here. Only
 * the fixed vocabulary the UI itself defines lives in this file.
 */

export const CATEGORIES = [
  { slug: "luxury", label: "Luxury" },
  { slug: "standard", label: "Standard" },
  { slug: "budget", label: "Budget" },
] as const;

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "top-rated", label: "Top Rated" },
  { value: "most-booked", label: "Most Booked" },
  { value: "newest", label: "New Listings" },
  { value: "featured", label: "Featured" },
] as const;
