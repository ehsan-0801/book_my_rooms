/** Bangladeshi Taka. The ৳ sign sits tight against the number in local usage. */
export function bdt(amount: number | string, opts: { compact?: boolean } = {}) {
  amount = typeof amount === "string" ? Number(amount) : amount;
  if (opts.compact && amount >= 1000) {
    const k = amount / 1000;
    return `৳${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(amount)}`;
}

/**
 * Dates arrive as `Date` from a server component and as an ISO string once the
 * same row has crossed an API boundary as JSON. Every date helper accepts both
 * so a component doesn't have to know where its data came from.
 */
export type DateLike = Date | string | number;

export const toDate = (value: DateLike): Date =>
  value instanceof Date ? value : new Date(value);

export function nightsBetween(checkIn: DateLike, checkOut: DateLike) {
  const ms = toDate(checkOut).getTime() - toDate(checkIn).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

const DATE_FMT_LONG = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatDate = (d: DateLike) => DATE_FMT.format(toDate(d));
export const formatDateLong = (d: DateLike) => DATE_FMT_LONG.format(toDate(d));

export function formatStayRange(checkIn: DateLike, checkOut: DateLike) {
  return `${formatDate(checkIn)} – ${formatDate(checkOut)}`;
}

/** "2 guests · 1 room" */
export function guestSummary(adults: number, children: number, rooms: number) {
  const guests = adults + children;
  return `${guests} guest${guests === 1 ? "" : "s"} · ${rooms} room${rooms === 1 ? "" : "s"}`;
}

export function ratingLabel(rating: number) {
  if (rating >= 4.6) return "Exceptional";
  if (rating >= 4.2) return "Excellent";
  if (rating >= 3.8) return "Very good";
  if (rating >= 3.2) return "Good";
  return "Fair";
}

/** Discounted price given a base price and a percentage off. */
export function applyDiscount(price: number, percentOff?: number) {
  if (!percentOff) return price;
  return Math.round(price * (1 - percentOff / 100));
}

/**
 * Cheapest nightly rate a property actually offers, after per-room discounts.
 * Falls back to the denormalised Property.basePrice when rooms aren't loaded
 * (listing cards select rooms' prices only).
 */
export function lowestRate(property: {
  basePrice: number;
  rooms: { basePrice: number; discountPercent?: number }[];
}) {
  if (!property.rooms.length) return property.basePrice;
  return Math.min(
    ...property.rooms.map((r) => applyDiscount(r.basePrice, r.discountPercent)),
  );
}
