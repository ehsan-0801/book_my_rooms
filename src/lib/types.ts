export type PropertyTypeSlug =
  | "hotel"
  | "resort"
  | "cottage"
  | "eco-resort"
  | "homestay"
  | "villa";

export type PropertyCategory = "luxury" | "standard" | "budget";

export type AmenitySlug =
  | "ac"
  | "non-ac"
  | "swimming-pool"
  | "free-breakfast"
  | "couple-friendly"
  | "family-friendly"
  | "wifi"
  | "parking"
  | "pet-friendly"
  | "nature-view";

export interface Amenity {
  slug: AmenitySlug | string;
  name: string;
  /** lucide-react icon name */
  icon: string;
}

/**
 * Amenities are admin-editable rows, so their label and icon travel with the
 * data rather than being resolved from a hardcoded map in the component.
 */
export interface AmenityRef {
  slug: string;
  name: string;
  icon: string | null;
}

export interface Destination {
  slug: string;
  name: string;
  division: string;
  tagline: string;
  image: string;
  propertyCount: number;
  fromPrice: number;
  /** Wikimedia attribution — required by the CC BY-SA licences */
  credit: { author: string; license: string; source: string };
}

export interface RoomImage {
  url: string;
  alt: string;
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: RoomImage;
  maxGuests: number;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  sizeSqft: number;
  unitsLeft: number;
  basePrice: number;
  discountPercent?: number;
  breakfastIncluded: boolean;
  isRefundable: boolean;
  amenities: AmenityRef[];
}

export interface Review {
  id: string;
  author: string;
  avatarInitials: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  stayedIn: string;
}

export interface NearbyAttraction {
  name: string;
  category: string;
  distanceKm: number;
}

export interface Property {
  id: string;
  slug: string;
  name: string;
  type: PropertyTypeSlug;
  typeLabel: string;
  category: PropertyCategory;
  destinationSlug: string;
  district: string;
  area: string;
  addressLine: string;
  contactPhone?: string;
  contactEmail?: string;
  shortDescription: string;
  description: string;
  images: RoomImage[];
  starRating: number;
  ratingAvg: number;
  ratingCount: number;
  basePrice: number;
  discountPercent?: number;
  isFeatured: boolean;
  isPremium: boolean;
  amenities: AmenityRef[];
  rooms: Room[];
  reviews: Review[];
  nearby: NearbyAttraction[];
  checkInTime: string;
  checkOutTime: string;
  policies: string[];
  rules: string[];
  cancellationPolicy: string;
  coords: { lat: number; lng: number };
}

export type SortKey =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "top-rated"
  | "most-booked"
  | "newest"
  | "featured";
