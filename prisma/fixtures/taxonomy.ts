/** Taxonomy fixtures used to seed PropertyType and Amenity rows. */
import type { Amenity } from "./types";

export const AMENITIES: Amenity[] = [
  { slug: "ac", name: "AC", icon: "Snowflake" },
  { slug: "non-ac", name: "Non-AC", icon: "Fan" },
  { slug: "swimming-pool", name: "Swimming Pool", icon: "Waves" },
  { slug: "free-breakfast", name: "Free Breakfast", icon: "Croissant" },
  { slug: "couple-friendly", name: "Couple Friendly", icon: "Heart" },
  { slug: "family-friendly", name: "Family Friendly", icon: "Users" },
  { slug: "wifi", name: "Free WiFi", icon: "Wifi" },
  { slug: "parking", name: "Parking", icon: "CircleParking" },
  { slug: "pet-friendly", name: "Pet Friendly", icon: "PawPrint" },
  { slug: "nature-view", name: "Nature View", icon: "Mountain" },
  { slug: "restaurant", name: "Restaurant", icon: "UtensilsCrossed" },
  { slug: "gym", name: "Fitness Centre", icon: "Dumbbell" },
  { slug: "spa", name: "Spa", icon: "Flower2" },
  { slug: "beach-access", name: "Beach Access", icon: "Umbrella" },
  { slug: "room-service", name: "24h Room Service", icon: "ConciergeBell" },
  { slug: "airport-shuttle", name: "Airport Shuttle", icon: "Plane" },
  { slug: "bonfire", name: "Bonfire", icon: "Flame" },
  { slug: "kayaking", name: "Kayaking", icon: "Sailboat" },
];

export const PROPERTY_TYPES = [
  { slug: "hotel", label: "Hotel", icon: "Building2" },
  { slug: "resort", label: "Resort", icon: "Palmtree" },
  { slug: "cottage", label: "Cottage", icon: "Home" },
  { slug: "eco-resort", label: "Eco Resort", icon: "Leaf" },
  { slug: "homestay", label: "Homestay", icon: "House" },
  { slug: "villa", label: "Villa", icon: "Castle" },
] as const;
