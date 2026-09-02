import type { Property, Review, Room } from "./types";

const P = "/images/properties";
const R = "/images/rooms";

/* ------------------------------------------------------------------ helpers */

let roomSeq = 0;
function room(
  name: string,
  image: string,
  alt: string,
  opts: Partial<Room> & Pick<Room, "basePrice" | "bedType" | "maxGuests">,
): Room {
  roomSeq += 1;
  return {
    id: `room-${roomSeq}`,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
    description: opts.description ?? "",
    image: { url: image, alt },
    maxGuests: opts.maxGuests,
    maxAdults: opts.maxAdults ?? opts.maxGuests,
    maxChildren: opts.maxChildren ?? 1,
    bedType: opts.bedType,
    sizeSqft: opts.sizeSqft ?? 320,
    unitsLeft: opts.unitsLeft ?? 4,
    basePrice: opts.basePrice,
    discountPercent: opts.discountPercent,
    breakfastIncluded: opts.breakfastIncluded ?? false,
    isRefundable: opts.isRefundable ?? true,
    amenities: opts.amenities ?? ["ac", "wifi"],
  };
}

let reviewSeq = 0;
function review(
  author: string,
  rating: number,
  title: string,
  comment: string,
  date: string,
  stayedIn: string,
): Review {
  reviewSeq += 1;
  return {
    id: `rev-${reviewSeq}`,
    author,
    avatarInitials: author
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join(""),
    rating,
    title,
    comment,
    date,
    stayedIn,
  };
}

/* --------------------------------------------------------------- properties */

export const PROPERTIES: Property[] = [
  {
    id: "prop-1",
    slug: "sea-pearl-beach-resort-spa",
    name: "Sea Pearl Beach Resort & Spa",
    type: "resort",
    typeLabel: "Resort",
    category: "luxury",
    destinationSlug: "coxs-bazar",
    district: "Cox's Bazar",
    area: "Inani Beach",
    addressLine: "Jaliapalong, Inani, Ukhia, Cox's Bazar 4750",
    shortDescription:
      "Beachfront five-star resort on Inani with a 100m infinity pool and direct sand access.",
    description:
      "Sea Pearl sits on the quiet stretch of Inani Beach, twenty minutes south of the Cox's Bazar crowds. Rooms face either the Bay of Bengal or the forested hills behind the property. The resort runs its own stretch of beach with loungers and umbrellas, three restaurants, and a spa using local herbal treatments. It is the most complete luxury option on the Cox's Bazar coast and works equally well for couples and families.",
    images: [
      { url: `${P}/sea-pearl-beach-resort.jpg`, alt: "Poolside deck with loungers facing the sea at Sea Pearl Beach Resort" },
      { url: `${P}/ocean-paradise.jpg`, alt: "Infinity pool overlooking the Bay of Bengal at sunset" },
      { url: `${R}/premier-suite.jpg`, alt: "Premier suite with a seating area and mirrored wall" },
      { url: `${R}/deluxe-twin.jpg`, alt: "Deluxe room with a king bed and warm bedside lamps" },
      { url: `${P}/lagoon-cabanas.jpg`, alt: "Curtained poolside cabanas lit at dusk" },
    ],
    starRating: 5,
    ratingAvg: 4.7,
    ratingCount: 1284,
    basePrice: 12500,
    discountPercent: 20,
    isFeatured: true,
    isPremium: true,
    amenities: ["ac", "swimming-pool", "free-breakfast", "wifi", "parking", "spa", "gym", "restaurant", "beach-access", "room-service", "family-friendly", "couple-friendly", "airport-shuttle"],
    rooms: [
      room("Deluxe Sea View", `${R}/deluxe-twin.jpg`, "Deluxe sea view room with king bed", {
        basePrice: 12500, bedType: "1 King Bed", maxGuests: 2, sizeSqft: 380, unitsLeft: 5,
        discountPercent: 20, breakfastIncluded: true,
        description: "Floor-to-ceiling window facing the Bay of Bengal, with a private balcony.",
        amenities: ["ac", "wifi", "nature-view", "room-service"],
      }),
      room("Premier Suite", `${R}/premier-suite.jpg`, "Premier suite with separate lounge", {
        basePrice: 21000, bedType: "1 King Bed + Sofa", maxGuests: 3, maxChildren: 2, sizeSqft: 640, unitsLeft: 2,
        discountPercent: 15, breakfastIncluded: true,
        description: "Separate lounge, walk-in wardrobe and a corner balcony over the beach.",
        amenities: ["ac", "wifi", "nature-view", "room-service", "spa"],
      }),
      room("Family Garden Room", `${R}/bright-suite.jpg`, "Bright family room opening to the garden", {
        basePrice: 15800, bedType: "1 King + 1 Single", maxGuests: 4, maxChildren: 2, sizeSqft: 520, unitsLeft: 3,
        breakfastIncluded: true,
        description: "Ground-floor room opening onto the garden lawn, a short walk from the pool.",
        amenities: ["ac", "wifi", "family-friendly", "parking"],
      }),
    ],
    reviews: [
      review("Nusrat Jahan", 5, "Worth every taka", "The Inani location is the whole point — no hawkers, no crowds, just clean beach. Staff remembered our names by day two. Breakfast spread was enormous.", "12 Aug 2026", "Deluxe Sea View"),
      review("Arif Hossain", 4, "Great resort, slow check-in", "Rooms and pool are genuinely five-star. Check-in took 40 minutes on a Friday though — go early or late.", "28 Jul 2026", "Premier Suite"),
      review("Tanvir Ahmed", 5, "Best family trip we've had", "Kids lived in the pool. Having the beach directly below meant we never needed a CNG all weekend.", "3 Jul 2026", "Family Garden Room"),
    ],
    nearby: [
      { name: "Inani Beach", category: "Beach", distanceKm: 0.1 },
      { name: "Himchari National Park", category: "Nature", distanceKm: 12.4 },
      { name: "Patuartek Beach", category: "Beach", distanceKm: 3.8 },
      { name: "Cox's Bazar Main Beach", category: "Beach", distanceKm: 18.2 },
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    policies: [
      "Valid photo ID required at check-in for all guests",
      "Children under 6 stay free using existing bedding",
      "Outside food and drink are not permitted in the rooms",
    ],
    rules: ["No smoking indoors", "Quiet hours 23:00 – 07:00", "Pets not allowed"],
    cancellationPolicy: "Free cancellation up to 48 hours before check-in. Within 48 hours, one night is charged.",
    coords: { lat: 21.2261, lng: 92.0403 },
  },

  {
    id: "prop-2",
    slug: "sayeman-beach-resort",
    name: "Sayeman Beach Resort",
    type: "resort",
    typeLabel: "Resort",
    category: "standard",
    destinationSlug: "coxs-bazar",
    district: "Cox's Bazar",
    area: "Kolatoli",
    addressLine: "Marine Drive Road, Kolatoli, Cox's Bazar 4700",
    shortDescription: "Long-standing Marine Drive resort with a big pool deck and easy beach access.",
    description:
      "Sayeman has been on the Cox's Bazar seafront for decades and was rebuilt as a modern resort on Marine Drive. It sits between Kolatoli and Laboni points, so the main beach, the seafood street and the market are all walkable. The pool deck is the highlight — it stays open late and looks straight down the coast.",
    images: [
      { url: `${P}/sayeman-beach.jpg`, alt: "Infinity pool deck and palm trees at Sayeman Beach Resort" },
      { url: `${P}/palm-grove-resort.jpg`, alt: "Resort pool framed by palms at dusk" },
      { url: `${R}/executive-king.jpg`, alt: "Executive king room with warm lighting" },
      { url: `${R}/standard-double.jpg`, alt: "Standard double room with city view" },
    ],
    starRating: 4,
    ratingAvg: 4.3,
    ratingCount: 892,
    basePrice: 6800,
    discountPercent: 15,
    isFeatured: true,
    isPremium: false,
    amenities: ["ac", "swimming-pool", "free-breakfast", "wifi", "parking", "restaurant", "beach-access", "family-friendly", "gym"],
    rooms: [
      room("Superior Twin", `${R}/standard-double.jpg`, "Superior twin room", {
        basePrice: 6800, bedType: "2 Twin Beds", maxGuests: 2, sizeSqft: 300, unitsLeft: 8,
        discountPercent: 15, breakfastIncluded: true,
        description: "Compact room with a partial sea view from the upper floors.",
        amenities: ["ac", "wifi", "parking"],
      }),
      room("Executive Sea View", `${R}/executive-king.jpg`, "Executive sea view king room", {
        basePrice: 9600, bedType: "1 King Bed", maxGuests: 2, sizeSqft: 420, unitsLeft: 3,
        discountPercent: 10, breakfastIncluded: true,
        description: "Full-width window onto Marine Drive and the water beyond.",
        amenities: ["ac", "wifi", "nature-view", "room-service"],
      }),
    ],
    reviews: [
      review("Sabbir Rahman", 4, "Location does the work", "Walk out and you're on the beach. Rooms are showing their age slightly but everything worked and the pool was spotless.", "19 Aug 2026", "Executive Sea View"),
      review("Farhana Akter", 5, "Lovely staff", "Asked for an early check-in and they sorted it without fuss. Breakfast has good Bangladeshi options, not just toast and eggs.", "2 Aug 2026", "Superior Twin"),
    ],
    nearby: [
      { name: "Kolatoli Beach Point", category: "Beach", distanceKm: 0.3 },
      { name: "Laboni Beach", category: "Beach", distanceKm: 1.9 },
      { name: "Burmese Market", category: "Shopping", distanceKm: 2.4 },
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    policies: ["Valid photo ID required at check-in", "Extra bed available on request for ৳1,200 per night"],
    rules: ["No smoking in rooms", "Pool closes at 22:00"],
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    coords: { lat: 21.4167, lng: 91.9792 },
  },

  {
    id: "prop-3",
    slug: "ocean-paradise-hotel",
    name: "Ocean Paradise Hotel",
    type: "hotel",
    typeLabel: "Hotel",
    category: "budget",
    destinationSlug: "coxs-bazar",
    district: "Cox's Bazar",
    area: "Kolatoli",
    addressLine: "Hotel Motel Zone, Kolatoli, Cox's Bazar 4700",
    shortDescription: "Reliable mid-range hotel a two-minute walk from Kolatoli beach point.",
    description:
      "A straightforward, well-run hotel in the Hotel-Motel Zone. No resort frills, but the rooms are clean, the AC is strong and the price holds steady even in peak season. Good pick if you plan to be out all day and just need a solid base near the beach.",
    images: [
      { url: `${P}/ocean-paradise.jpg`, alt: "Pool terrace with sea view at Ocean Paradise Hotel" },
      { url: `${R}/standard-double.jpg`, alt: "Standard double room" },
      { url: `${R}/bright-suite.jpg`, alt: "Bright corner room with large windows" },
    ],
    starRating: 3,
    ratingAvg: 4.0,
    ratingCount: 507,
    basePrice: 3200,
    isFeatured: false,
    isPremium: false,
    amenities: ["ac", "wifi", "parking", "restaurant", "family-friendly", "swimming-pool"],
    rooms: [
      room("Standard Double", `${R}/standard-double.jpg`, "Standard double room", {
        basePrice: 3200, bedType: "1 Double Bed", maxGuests: 2, sizeSqft: 240, unitsLeft: 12,
        description: "Clean, quiet room facing the internal courtyard.",
        amenities: ["ac", "wifi"],
      }),
      room("Deluxe Family", `${R}/bright-suite.jpg`, "Deluxe family room", {
        basePrice: 4900, bedType: "1 Double + 1 Single", maxGuests: 4, maxChildren: 2, sizeSqft: 360, unitsLeft: 6,
        breakfastIncluded: true,
        description: "Corner room with extra floor space for a cot or extra bed.",
        amenities: ["ac", "wifi", "family-friendly"],
      }),
    ],
    reviews: [
      review("Imran Kabir", 4, "Does exactly what it says", "Cheap, clean, close to the beach. Don't expect a resort and you'll be happy.", "8 Aug 2026", "Standard Double"),
      review("Rumana Islam", 4, "Good value in peak season", "Everywhere else doubled their rate in December. This place didn't.", "22 Jul 2026", "Deluxe Family"),
    ],
    nearby: [
      { name: "Kolatoli Beach Point", category: "Beach", distanceKm: 0.2 },
      { name: "Seafood Street", category: "Restaurant", distanceKm: 0.6 },
    ],
    checkInTime: "13:00",
    checkOutTime: "11:00",
    policies: ["Valid photo ID required", "Advance payment required for peak-season weekends"],
    rules: ["No smoking in rooms", "Visitors not allowed in rooms after 22:00"],
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    coords: { lat: 21.4211, lng: 91.9805 },
  },

  {
    id: "prop-4",
    slug: "coral-lagoon-cabanas",
    name: "Coral Lagoon Cabanas",
    type: "resort",
    typeLabel: "Resort",
    category: "luxury",
    destinationSlug: "saint-martin",
    district: "Saint Martin's Island",
    area: "West Beach",
    addressLine: "West Beach Road, Saint Martin's Island, Teknaf 4761",
    shortDescription: "Private cabanas over a shallow lagoon on the island's calm western shore.",
    description:
      "Twelve cabanas set around a shallow lagoon on the west side of the island, where the water stays calm enough to swim at almost any tide. Power runs on solar with a generator backup, and the kitchen cooks whatever the boats bring in that morning. Booking includes the Teknaf ferry transfer.",
    images: [
      { url: `${P}/lagoon-cabanas.jpg`, alt: "Curtained cabanas around a lit pool at dusk" },
      { url: `${P}/sea-pearl-beach-resort.jpg`, alt: "Beachfront deck with loungers" },
      { url: `${R}/garden-villa.jpg`, alt: "Timber-lined cabana bedroom opening to a garden" },
    ],
    starRating: 4,
    ratingAvg: 4.8,
    ratingCount: 341,
    basePrice: 9800,
    discountPercent: 10,
    isFeatured: true,
    isPremium: true,
    amenities: ["ac", "free-breakfast", "wifi", "restaurant", "beach-access", "couple-friendly", "nature-view", "kayaking", "bonfire"],
    rooms: [
      room("Lagoon Cabana", `${R}/garden-villa.jpg`, "Timber cabana facing the lagoon", {
        basePrice: 9800, bedType: "1 King Bed", maxGuests: 2, sizeSqft: 400, unitsLeft: 3,
        discountPercent: 10, breakfastIncluded: true,
        description: "Standalone timber cabana with a deck stepping straight into the lagoon.",
        amenities: ["ac", "wifi", "nature-view", "couple-friendly"],
      }),
      room("Beachfront Cabana", `${R}/bright-suite.jpg`, "Bright beachfront cabana interior", {
        basePrice: 13400, bedType: "1 King Bed", maxGuests: 3, sizeSqft: 480, unitsLeft: 1,
        breakfastIncluded: true,
        description: "Front row on the sand, with an outdoor shower and hammock deck.",
        amenities: ["ac", "wifi", "nature-view", "beach-access"],
      }),
    ],
    reviews: [
      review("Zarin Tasnim", 5, "The best two nights of the trip", "Swimming in the lagoon at sunrise with nobody else around. The fish curry at dinner was outstanding.", "14 Feb 2026", "Lagoon Cabana"),
      review("Mahmudul Hasan", 5, "Genuinely special", "Solar power means the fans cut out briefly at night, which they warn you about. Everything else was flawless.", "29 Jan 2026", "Beachfront Cabana"),
    ],
    nearby: [
      { name: "Chera Dwip", category: "Nature", distanceKm: 8.1 },
      { name: "West Beach Coral Flats", category: "Beach", distanceKm: 0.1 },
      { name: "Island Jetty", category: "Transport", distanceKm: 2.3 },
    ],
    checkInTime: "13:00",
    checkOutTime: "11:00",
    policies: [
      "Ferry transfer from Teknaf included with every booking",
      "Island access is seasonal — sailings typically run October to March",
    ],
    rules: ["No single-use plastics on the property", "Quiet hours from 23:00"],
    cancellationPolicy: "Free cancellation up to 7 days before check-in. Ferry seats cannot be refunded within 72 hours.",
    coords: { lat: 20.6229, lng: 92.3221 },
  },

  {
    id: "prop-5",
    slug: "royal-tulip-sylhet",
    name: "Royal Tulip Grand Sylhet",
    type: "hotel",
    typeLabel: "Hotel",
    category: "luxury",
    destinationSlug: "sylhet",
    district: "Sylhet",
    area: "Khadimnagar",
    addressLine: "Khadimnagar, Airport Road, Sylhet 3100",
    shortDescription: "Five-star city hotel set in tea garden grounds, ten minutes from Osmani Airport.",
    description:
      "The Royal Tulip occupies a large walled site between the airport and the city, with tea garden slopes forming the back boundary. It is the default choice for business travellers in Sylhet and for families breaking the journey to Jaflong or Sreemangal. The pool and grounds are the largest of any hotel in the division.",
    images: [
      { url: `${P}/royal-tulip.jpg`, alt: "Lit facade and large pool at Royal Tulip Grand Sylhet" },
      { url: `${R}/premier-suite.jpg`, alt: "Premier suite with sofa and green drapes" },
      { url: `${R}/executive-king.jpg`, alt: "Executive king room" },
      { url: `${P}/courtyard-boutique.jpg`, alt: "Planted courtyard with café seating" },
    ],
    starRating: 5,
    ratingAvg: 4.5,
    ratingCount: 736,
    basePrice: 11200,
    discountPercent: 12,
    isFeatured: true,
    isPremium: true,
    amenities: ["ac", "swimming-pool", "free-breakfast", "wifi", "parking", "gym", "spa", "restaurant", "room-service", "airport-shuttle", "family-friendly"],
    rooms: [
      room("Deluxe King", `${R}/executive-king.jpg`, "Deluxe king room", {
        basePrice: 11200, bedType: "1 King Bed", maxGuests: 2, sizeSqft: 400, unitsLeft: 9,
        discountPercent: 12, breakfastIncluded: true,
        description: "Garden-facing room with a work desk and rain shower.",
        amenities: ["ac", "wifi", "room-service", "parking"],
      }),
      room("Executive Suite", `${R}/premier-suite.jpg`, "Executive suite with lounge", {
        basePrice: 18500, bedType: "1 King Bed + Lounge", maxGuests: 3, sizeSqft: 700, unitsLeft: 2,
        breakfastIncluded: true,
        description: "Corner suite with a separate lounge and access to the executive floor.",
        amenities: ["ac", "wifi", "room-service", "gym", "spa"],
      }),
    ],
    reviews: [
      review("Shahriar Kabir", 5, "Best hotel in Sylhet", "Used it as a base for three days of driving to Jaflong and Ratargul. Airport pickup was waiting every time.", "16 Aug 2026", "Deluxe King"),
      review("Nadia Chowdhury", 4, "Excellent, but book the garden side", "Rooms facing the road pick up traffic noise early. Garden side was silent.", "1 Aug 2026", "Executive Suite"),
    ],
    nearby: [
      { name: "Osmani International Airport", category: "Transport", distanceKm: 4.2 },
      { name: "Hazrat Shahjalal Dargah", category: "Attraction", distanceKm: 9.6 },
      { name: "Malnicherra Tea Estate", category: "Nature", distanceKm: 6.1 },
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    policies: ["Valid photo ID required", "Airport shuttle free on request with 3 hours' notice"],
    rules: ["No smoking indoors", "Pets not allowed"],
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    coords: { lat: 24.9633, lng: 91.8687 },
  },

  {
    id: "prop-6",
    slug: "courtyard-boutique-sylhet",
    name: "The Courtyard Boutique",
    type: "hotel",
    typeLabel: "Hotel",
    category: "standard",
    destinationSlug: "sylhet",
    district: "Sylhet",
    area: "Zindabazar",
    addressLine: "Nayasarak Road, Zindabazar, Sylhet 3100",
    shortDescription: "Small design-led hotel around a planted courtyard in the middle of Zindabazar.",
    description:
      "Eighteen rooms wrapped around a tiled courtyard full of palms, right in the Zindabazar shopping district. The café in the courtyard is open to the public and is one of the better coffee spots in the city. Rooms are compact but carefully finished.",
    images: [
      { url: `${P}/courtyard-boutique.jpg`, alt: "Tiled courtyard with green chairs and palms" },
      { url: `${R}/bright-suite.jpg`, alt: "Bright minimal bedroom" },
      { url: `${R}/standard-double.jpg`, alt: "Compact double room" },
    ],
    starRating: 3,
    ratingAvg: 4.4,
    ratingCount: 289,
    basePrice: 4600,
    isFeatured: false,
    isPremium: false,
    amenities: ["ac", "wifi", "free-breakfast", "restaurant", "couple-friendly", "parking"],
    rooms: [
      room("Courtyard Double", `${R}/standard-double.jpg`, "Courtyard-facing double room", {
        basePrice: 4600, bedType: "1 Double Bed", maxGuests: 2, sizeSqft: 260, unitsLeft: 5,
        breakfastIncluded: true,
        description: "Window opening onto the planted courtyard, away from street noise.",
        amenities: ["ac", "wifi", "couple-friendly"],
      }),
      room("Loft Room", `${R}/bright-suite.jpg`, "Top-floor loft room", {
        basePrice: 6200, bedType: "1 Queen Bed", maxGuests: 2, sizeSqft: 340, unitsLeft: 2,
        breakfastIncluded: true,
        description: "Top-floor room with a pitched ceiling and skylight.",
        amenities: ["ac", "wifi", "couple-friendly"],
      }),
    ],
    reviews: [
      review("Ayesha Siddika", 5, "Charming and central", "Everything in Zindabazar is a five-minute walk. The courtyard café is worth the stay on its own.", "11 Aug 2026", "Loft Room"),
      review("Rakib Uddin", 4, "Small rooms, great design", "Don't book it for space. Book it for the atmosphere and the location.", "20 Jul 2026", "Courtyard Double"),
    ],
    nearby: [
      { name: "Zindabazar Shopping", category: "Shopping", distanceKm: 0.2 },
      { name: "Hazrat Shahjalal Dargah", category: "Attraction", distanceKm: 2.1 },
      { name: "Keane Bridge", category: "Attraction", distanceKm: 1.4 },
    ],
    checkInTime: "14:00",
    checkOutTime: "11:00",
    policies: ["Valid photo ID required", "Limited on-site parking — reserve ahead"],
    rules: ["No smoking indoors", "Courtyard café closes at 23:00"],
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    coords: { lat: 24.8949, lng: 91.8687 },
  },

  {
    id: "prop-7",
    slug: "tea-estate-cottage-sreemangal",
    name: "Tea Estate Cottage",
    type: "cottage",
    typeLabel: "Cottage",
    category: "standard",
    destinationSlug: "sreemangal",
    district: "Moulvibazar",
    area: "Sreemangal",
    addressLine: "Satgaon Tea Estate Road, Sreemangal, Moulvibazar 3210",
    shortDescription: "Restored planter's cottage with stone walls, set inside a working tea estate.",
    description:
      "A colonial-era planter's bungalow on the edge of a working tea estate, restored with the original stone and timber left exposed. Mornings start with mist over the tea rows and the estate's own first-flush at breakfast. Lawachara National Park is a fifteen-minute drive, and the manager arranges guided walks.",
    images: [
      { url: `${P}/tea-estate-cottage.jpg`, alt: "Stone-walled cottage bedroom with exposed beams" },
      { url: `${P}/eco-villa-lawachara.jpg`, alt: "Villa living space with wide windows onto forest" },
      { url: `${R}/garden-villa.jpg`, alt: "Timber bedroom with garden view" },
    ],
    starRating: 3,
    ratingAvg: 4.6,
    ratingCount: 412,
    basePrice: 5400,
    discountPercent: 18,
    isFeatured: true,
    isPremium: false,
    amenities: ["ac", "wifi", "free-breakfast", "nature-view", "parking", "family-friendly", "bonfire", "restaurant"],
    rooms: [
      room("Planter's Room", `${P}/tea-estate-cottage.jpg`, "Stone-walled planter's room", {
        basePrice: 5400, bedType: "1 Queen Bed", maxGuests: 2, sizeSqft: 380, unitsLeft: 4,
        discountPercent: 18, breakfastIncluded: true,
        description: "Original stone walls, a wood-burning stove and a veranda over the tea rows.",
        amenities: ["ac", "wifi", "nature-view"],
      }),
      room("Garden Cottage", `${R}/garden-villa.jpg`, "Garden cottage bedroom", {
        basePrice: 7200, bedType: "1 King Bed", maxGuests: 3, maxChildren: 1, sizeSqft: 460, unitsLeft: 2,
        breakfastIncluded: true,
        description: "Separate cottage in the garden with its own sit-out and outdoor shower.",
        amenities: ["ac", "wifi", "nature-view", "family-friendly"],
      }),
    ],
    reviews: [
      review("Sadia Afrin", 5, "Woke up inside a postcard", "Mist sitting on the tea rows at 6am with a cup of the estate's own tea. Nothing else in Sreemangal comes close.", "5 Aug 2026", "Planter's Room"),
      review("Kamrul Hasan", 4, "Beautiful, slightly remote", "You need a car or the estate's pickup. That's the trade-off for the setting.", "18 Jul 2026", "Garden Cottage"),
      review("Priya Das", 5, "The guided walk made it", "The manager took us through Lawachara at dawn and we saw hoolock gibbons. Book it.", "30 Jun 2026", "Planter's Room"),
    ],
    nearby: [
      { name: "Lawachara National Park", category: "Nature", distanceKm: 9.3 },
      { name: "Satgaon Tea Estate", category: "Nature", distanceKm: 0.4 },
      { name: "Madhabpur Lake", category: "Nature", distanceKm: 14.7 },
      { name: "Seven Layer Tea, Nilkantha", category: "Restaurant", distanceKm: 6.2 },
    ],
    checkInTime: "13:00",
    checkOutTime: "11:00",
    policies: ["Estate pickup from Sreemangal station on request", "Breakfast included for all guests"],
    rules: ["No loud music — the estate is a working plantation", "Bonfire by arrangement only"],
    cancellationPolicy: "Free cancellation up to 72 hours before check-in.",
    coords: { lat: 24.3065, lng: 91.7296 },
  },

  {
    id: "prop-8",
    slug: "lawachara-eco-villa",
    name: "Lawachara Eco Villa",
    type: "eco-resort",
    typeLabel: "Eco Resort",
    category: "standard",
    destinationSlug: "sreemangal",
    district: "Moulvibazar",
    area: "Kamalganj",
    addressLine: "Lawachara Forest Edge, Kamalganj, Moulvibazar 3220",
    shortDescription: "Off-grid villa on the rainforest boundary, running entirely on solar.",
    description:
      "Built on the forest boundary with rammed-earth walls and a glazed north face that looks straight into the canopy. Entirely solar-powered, with rainwater harvesting and no single-use plastic anywhere on site. Gibbon calls at dawn are effectively the alarm clock.",
    images: [
      { url: `${P}/eco-villa-lawachara.jpg`, alt: "Open-plan villa living space facing the forest" },
      { url: `${R}/garden-villa.jpg`, alt: "Timber-lined bedroom opening onto planting" },
      { url: `${P}/tea-estate-cottage.jpg`, alt: "Stone interior with soft lighting" },
    ],
    starRating: 4,
    ratingAvg: 4.7,
    ratingCount: 226,
    basePrice: 7600,
    isFeatured: false,
    isPremium: true,
    amenities: ["wifi", "free-breakfast", "nature-view", "parking", "pet-friendly", "couple-friendly", "bonfire", "non-ac"],
    rooms: [
      room("Canopy Villa", `${P}/eco-villa-lawachara.jpg`, "Canopy villa with forest-facing glazing", {
        basePrice: 7600, bedType: "1 King Bed", maxGuests: 2, sizeSqft: 520, unitsLeft: 2,
        breakfastIncluded: true, isRefundable: false,
        description: "Full-height glazing onto the canopy, with a deep shaded deck.",
        amenities: ["wifi", "nature-view", "couple-friendly", "non-ac"],
      }),
      room("Forest Room", `${R}/garden-villa.jpg`, "Forest-facing room with timber lining", {
        basePrice: 5900, bedType: "1 Queen Bed", maxGuests: 2, sizeSqft: 340, unitsLeft: 3,
        breakfastIncluded: true,
        description: "Smaller room on the ground floor opening onto native planting.",
        amenities: ["wifi", "nature-view", "pet-friendly", "non-ac"],
      }),
    ],
    reviews: [
      review("Ishrat Jahan", 5, "Completely disconnected", "No AC and you genuinely don't need it — the design keeps it cool. Woke up to gibbons both mornings.", "9 Aug 2026", "Canopy Villa"),
      review("Nabil Ahsan", 4, "Bring a torch", "Solar lighting is deliberately dim after dark. That's the point, but pack a headlamp.", "26 Jul 2026", "Forest Room"),
    ],
    nearby: [
      { name: "Lawachara National Park", category: "Nature", distanceKm: 1.1 },
      { name: "Madhabpur Lake", category: "Nature", distanceKm: 11.2 },
      { name: "Manipuri Para", category: "Attraction", distanceKm: 5.8 },
    ],
    checkInTime: "14:00",
    checkOutTime: "11:00",
    policies: ["Solar power — heavy appliances are not supported", "Breakfast included, sourced from the neighbouring village"],
    rules: ["No single-use plastics", "No amplified music", "Torch provided in every room"],
    cancellationPolicy: "Non-refundable rate. Dates may be moved once, up to 14 days before check-in.",
    coords: { lat: 24.3242, lng: 91.7869 },
  },

  {
    id: "prop-9",
    slug: "nilgiri-hill-resort",
    name: "Nilgiri Hill Resort",
    type: "resort",
    typeLabel: "Resort",
    category: "standard",
    destinationSlug: "bandarban",
    district: "Bandarban",
    area: "Nilgiri",
    addressLine: "Nilgiri Peak, Thanchi Road, Bandarban 4600",
    shortDescription: "Cottages on the Nilgiri ridge, often above the cloud line at sunrise.",
    description:
      "At roughly 2,200 feet, Nilgiri sits high enough that the clouds regularly sit below the cottages at dawn. The rooms are simple and the road up is slow, but the view off the ridge is the single best one in Bangladesh. Book the ridge-facing cottages — the others look into the hillside.",
    images: [
      { url: `${P}/nilgiri-hill-resort.jpg`, alt: "Loungers on a terrace overlooking hills at sunrise" },
      { url: `${P}/hillside-retreat.jpg`, alt: "Resort pool set against limestone hills" },
      { url: `${P}/cliff-camp-sajek.jpg`, alt: "Outdoor bed on a deck facing a mountain valley" },
    ],
    starRating: 3,
    ratingAvg: 4.5,
    ratingCount: 634,
    basePrice: 5800,
    discountPercent: 10,
    isFeatured: true,
    isPremium: false,
    amenities: ["nature-view", "restaurant", "parking", "family-friendly", "bonfire", "non-ac", "wifi"],
    rooms: [
      room("Ridge Cottage", `${P}/nilgiri-hill-resort.jpg`, "Ridge-facing cottage terrace", {
        basePrice: 5800, bedType: "1 Double Bed", maxGuests: 2, sizeSqft: 300, unitsLeft: 3,
        discountPercent: 10,
        description: "Front-row cottage on the ridge, with a private terrace facing east.",
        amenities: ["nature-view", "non-ac", "bonfire"],
      }),
      room("Family Cottage", `${P}/hillside-retreat.jpg`, "Family cottage with hillside view", {
        basePrice: 8400, bedType: "2 Double Beds", maxGuests: 5, maxChildren: 3, sizeSqft: 480, unitsLeft: 2,
        description: "Two-bedroom cottage set slightly back from the ridge.",
        amenities: ["nature-view", "family-friendly", "non-ac"],
      }),
    ],
    reviews: [
      review("Tahmid Rahman", 5, "Above the clouds, literally", "Got up at 5:30 and the entire valley was white below us. Worth the four-hour drive from Chattogram.", "13 Aug 2026", "Ridge Cottage"),
      review("Lamia Sultana", 4, "Book the ridge side", "We got a hillside cottage first and moved. The view is the entire reason to come here.", "31 Jul 2026", "Family Cottage"),
      review("Sourav Barua", 4, "Basic rooms, unbeatable setting", "Don't come expecting a resort. Come for the sunrise.", "12 Jul 2026", "Ridge Cottage"),
    ],
    nearby: [
      { name: "Nilgiri Viewpoint", category: "Nature", distanceKm: 0.1 },
      { name: "Chimbuk Hill", category: "Nature", distanceKm: 18.4 },
      { name: "Shoilo Propat Waterfall", category: "Waterfall", distanceKm: 32.6 },
    ],
    checkInTime: "12:00",
    checkOutTime: "11:00",
    policies: [
      "Army permit checkpoint on the access road — carry NID for all adults",
      "Foreign nationals must arrange permission in advance",
    ],
    rules: ["No alcohol on the premises", "Gates close at 21:00"],
    cancellationPolicy: "Free cancellation up to 72 hours before check-in.",
    coords: { lat: 21.9167, lng: 92.2833 },
  },

  {
    id: "prop-10",
    slug: "hillside-retreat-bandarban",
    name: "Hillside Retreat Bandarban",
    type: "resort",
    typeLabel: "Resort",
    category: "luxury",
    destinationSlug: "bandarban",
    district: "Bandarban",
    area: "Meghla",
    addressLine: "Meghla Tourist Complex Road, Bandarban Sadar 4600",
    shortDescription: "Valley-floor resort with a full-size pool, ten minutes from Bandarban town.",
    description:
      "The most comfortable base in Bandarban, on the valley floor near Meghla rather than up on the ridges. A proper pool, reliable power and a kitchen that handles both Bangladeshi and Continental menus. Use it as the comfortable end of a hill-tracts trip, with day drives up to Nilgiri and Chimbuk.",
    images: [
      { url: `${P}/hillside-retreat.jpg`, alt: "Resort pool with thatched pavilions and limestone hills behind" },
      { url: `${R}/premier-suite.jpg`, alt: "Premier suite interior" },
      { url: `${R}/deluxe-twin.jpg`, alt: "Deluxe room with king bed" },
      { url: `${P}/nilgiri-hill-resort.jpg`, alt: "Hillside terrace at sunrise" },
    ],
    starRating: 4,
    ratingAvg: 4.4,
    ratingCount: 398,
    basePrice: 8900,
    discountPercent: 15,
    isFeatured: false,
    isPremium: true,
    amenities: ["ac", "swimming-pool", "free-breakfast", "wifi", "parking", "restaurant", "nature-view", "family-friendly", "spa"],
    rooms: [
      room("Valley Deluxe", `${R}/deluxe-twin.jpg`, "Valley-facing deluxe room", {
        basePrice: 8900, bedType: "1 King Bed", maxGuests: 2, sizeSqft: 360, unitsLeft: 6,
        discountPercent: 15, breakfastIncluded: true,
        description: "Balcony facing the hills, a short walk from the pool deck.",
        amenities: ["ac", "wifi", "nature-view"],
      }),
      room("Hill Suite", `${R}/premier-suite.jpg`, "Hill suite with lounge area", {
        basePrice: 14200, bedType: "1 King Bed + Sofa", maxGuests: 4, maxChildren: 2, sizeSqft: 620, unitsLeft: 2,
        breakfastIncluded: true,
        description: "Upper-floor suite with a wraparound balcony and separate lounge.",
        amenities: ["ac", "wifi", "nature-view", "family-friendly", "spa"],
      }),
    ],
    reviews: [
      review("Rifat Chowdhury", 5, "Comfortable base for the hills", "Drove up to Nilgiri for sunrise and came back to a real pool. Best of both.", "21 Aug 2026", "Valley Deluxe"),
      review("Anika Tabassum", 4, "Great pool, average food", "The resort itself is excellent. We ended up eating in town most nights.", "6 Aug 2026", "Hill Suite"),
    ],
    nearby: [
      { name: "Meghla Tourist Complex", category: "Attraction", distanceKm: 1.2 },
      { name: "Nilachal Viewpoint", category: "Nature", distanceKm: 7.9 },
      { name: "Golden Temple (Buddha Dhatu Jadi)", category: "Attraction", distanceKm: 5.3 },
    ],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    policies: ["Valid NID or passport required for all adults", "Hill-tract permits assisted at reception"],
    rules: ["No smoking indoors", "Pool closes at 21:00"],
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    coords: { lat: 22.1953, lng: 92.2184 },
  },

  {
    id: "prop-11",
    slug: "cliff-camp-sajek",
    name: "Cliff Camp Sajek",
    type: "homestay",
    typeLabel: "Homestay",
    category: "budget",
    destinationSlug: "rangamati",
    district: "Rangamati",
    area: "Sajek Valley",
    addressLine: "Konglak Para, Sajek Valley, Baghaichhari, Rangamati 4590",
    shortDescription: "Community-run bamboo homestay on the Konglak ridge, above the cloud line.",
    description:
      "Run by a Lusai family on the Konglak ridge at the far end of Sajek. Bamboo rooms with a shared deck that hangs over the valley — the cloud sea at sunrise is the reason people make the long drive from Khagrachhari. Simple, cheap, and the most memorable night in the Hill Tracts.",
    images: [
      { url: `${P}/cliff-camp-sajek.jpg`, alt: "Bed on an open deck overlooking a mountain valley at sunrise" },
      { url: `${P}/nilgiri-hill-resort.jpg`, alt: "Ridge terrace with loungers above the hills" },
    ],
    starRating: 2,
    ratingAvg: 4.6,
    ratingCount: 517,
    basePrice: 1500,
    isFeatured: false,
    isPremium: false,
    amenities: ["nature-view", "non-ac", "bonfire", "family-friendly", "parking"],
    rooms: [
      room("Bamboo Twin", `${P}/cliff-camp-sajek.jpg`, "Bamboo twin room opening onto the valley deck", {
        basePrice: 1500, bedType: "2 Single Beds", maxGuests: 2, sizeSqft: 160, unitsLeft: 6,
        description: "Bamboo-walled room opening straight onto the shared valley deck.",
        amenities: ["nature-view", "non-ac"],
      }),
      room("Ridge Family Room", `${P}/nilgiri-hill-resort.jpg`, "Larger ridge-facing family room", {
        basePrice: 2600, bedType: "1 Double + 2 Single", maxGuests: 4, maxChildren: 2, sizeSqft: 280, unitsLeft: 2,
        description: "The corner room at the end of the ridge, with windows on two sides.",
        amenities: ["nature-view", "non-ac", "family-friendly"],
      }),
    ],
    reviews: [
      review("Mehedi Hasan", 5, "Unforgettable for 1500 taka", "Shared bathroom, cold water, bamboo walls. And a sunrise I'll remember for years.", "17 Aug 2026", "Bamboo Twin"),
      review("Trisha Roy", 4, "Manage your expectations", "It's a homestay, not a hotel. The family were wonderful hosts and cooked for us.", "4 Aug 2026", "Ridge Family Room"),
      review("Jubayer Alam", 5, "The cloud sea is real", "Got up at 5am, sat on the deck, and watched the whole valley fill with cloud below us.", "23 Jul 2026", "Bamboo Twin"),
    ],
    nearby: [
      { name: "Konglak Para Viewpoint", category: "Nature", distanceKm: 0.3 },
      { name: "Sajek Helipad", category: "Attraction", distanceKm: 1.8 },
      { name: "Ruilui Para", category: "Attraction", distanceKm: 2.4 },
    ],
    checkInTime: "12:00",
    checkOutTime: "10:00",
    policies: [
      "Army escort convoy from Khagrachhari — departures at 10:30 and 15:30 only",
      "Carry NID; foreign nationals need prior permission",
    ],
    rules: ["Shared bathrooms", "Water is limited — short showers please", "No amplified music after 22:00"],
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    coords: { lat: 23.3819, lng: 92.2947 },
  },

  {
    id: "prop-12",
    slug: "palm-grove-resort-kuakata",
    name: "Palm Grove Resort Kuakata",
    type: "resort",
    typeLabel: "Resort",
    category: "standard",
    destinationSlug: "kuakata",
    district: "Patuakhali",
    area: "Kuakata",
    addressLine: "Kuakata Beach Road, Kalapara, Patuakhali 8650",
    shortDescription: "Palm-shaded resort a short walk from the beach where sunrise and sunset both land.",
    description:
      "Kuakata's draw is that the beach faces the right way for both sunrise and sunset over the water, and Palm Grove sits close enough to walk to either. The pool sits in a grove of mature palms, and the resort runs boat trips out to Fatra Char and the Gangamati reserve forest.",
    images: [
      { url: `${P}/palm-grove-resort.jpg`, alt: "Pool ringed by palm trees under a violet dusk sky" },
      { url: `${P}/sayeman-beach.jpg`, alt: "Pool deck with loungers facing the sea" },
      { url: `${R}/executive-king.jpg`, alt: "Executive king room with warm lighting" },
    ],
    starRating: 4,
    ratingAvg: 4.2,
    ratingCount: 274,
    basePrice: 4800,
    discountPercent: 12,
    isFeatured: false,
    isPremium: false,
    amenities: ["ac", "swimming-pool", "free-breakfast", "wifi", "parking", "restaurant", "beach-access", "family-friendly", "nature-view"],
    rooms: [
      room("Palm Deluxe", `${R}/executive-king.jpg`, "Deluxe room facing the palm grove", {
        basePrice: 4800, bedType: "1 King Bed", maxGuests: 2, sizeSqft: 320, unitsLeft: 7,
        discountPercent: 12, breakfastIncluded: true,
        description: "Ground-floor room opening onto the palm grove and pool.",
        amenities: ["ac", "wifi", "nature-view"],
      }),
      room("Sunset Family Room", `${P}/sayeman-beach.jpg`, "Family room on the sunset side", {
        basePrice: 7400, bedType: "1 King + 2 Single", maxGuests: 5, maxChildren: 3, sizeSqft: 500, unitsLeft: 2,
        breakfastIncluded: true,
        description: "Upper-floor corner room on the west side, facing the sunset.",
        amenities: ["ac", "wifi", "family-friendly", "beach-access"],
      }),
    ],
    reviews: [
      review("Shakil Mahmud", 4, "Both sunrise and sunset", "Walked to Gangamati for sunrise and back to Zero Point for sunset. Only place in the country you can do that.", "15 Aug 2026", "Palm Deluxe"),
      review("Nusaiba Karim", 4, "Good family option", "Pool kept the kids busy, and the boat trip to Fatra Char was well organised.", "27 Jul 2026", "Sunset Family Room"),
    ],
    nearby: [
      { name: "Kuakata Zero Point", category: "Beach", distanceKm: 0.8 },
      { name: "Gangamati Reserve Forest", category: "Nature", distanceKm: 6.4 },
      { name: "Fatra Char", category: "Nature", distanceKm: 11.5 },
      { name: "Rakhine Buddhist Temple", category: "Attraction", distanceKm: 1.6 },
    ],
    checkInTime: "13:00",
    checkOutTime: "11:00",
    policies: ["Valid photo ID required", "Boat trips subject to weather and tide"],
    rules: ["No smoking indoors", "Pool closes at 21:30"],
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    coords: { lat: 21.8167, lng: 90.1206 },
  },
];

/* ------------------------------------------------------------------ lookups */

export const PROPERTY_MAP = new Map(PROPERTIES.map((p) => [p.slug, p]));

export const getProperty = (slug: string) => PROPERTY_MAP.get(slug);

export const featuredProperties = () => PROPERTIES.filter((p) => p.isFeatured);

export const budgetProperties = () =>
  [...PROPERTIES].filter((p) => p.category === "budget" || p.basePrice <= 5500)
    .sort((a, b) => a.basePrice - b.basePrice);

export const ecoProperties = () =>
  PROPERTIES.filter((p) => p.type === "eco-resort" || p.amenities.includes("nature-view"));

export const discountedProperties = () =>
  [...PROPERTIES].filter((p) => (p.discountPercent ?? 0) > 0)
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));

export const propertiesIn = (destinationSlug: string) =>
  PROPERTIES.filter((p) => p.destinationSlug === destinationSlug);

/** Cheapest nightly rate actually offered, after any room-level discount. */
export function lowestRate(p: Property) {
  return Math.min(
    ...p.rooms.map((r) =>
      r.discountPercent ? Math.round(r.basePrice * (1 - r.discountPercent / 100)) : r.basePrice,
    ),
  );
}

/** Every review across the marketplace, newest-looking first — for the homepage. */
export const topReviews = () =>
  PROPERTIES.flatMap((p) =>
    p.reviews
      .filter((r) => r.rating >= 5)
      .map((r) => ({
        ...r,
        propertyName: p.name,
        propertySlug: p.slug,
        destinationSlug: p.destinationSlug,
        district: p.district,
      })),
  );
