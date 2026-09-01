/** Bangladeshi Taka. The ৳ sign sits tight against the number in local usage. */
export function bdt(amount: number, opts: { compact?: boolean } = {}) {
  if (opts.compact && amount >= 1000) {
    const k = amount / 1000;
    return `৳${k % 1 === 0 ? k : k.toFixed(1)}k`;
  }
  return `৳${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function nightsBetween(checkIn: Date, checkOut: Date) {
  const ms = checkOut.getTime() - checkIn.getTime();
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

export const formatDate = (d: Date) => DATE_FMT.format(d);
export const formatDateLong = (d: Date) => DATE_FMT_LONG.format(d);

export function formatStayRange(checkIn: Date, checkOut: Date) {
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
