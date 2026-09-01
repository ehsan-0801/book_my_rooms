import type { Destination } from "./types";

/**
 * Destination photography comes from Wikimedia Commons. Every image is CC-licensed
 * and its attribution travels with the record so the UI can render the credit —
 * CC BY-SA requires it.
 */
export const DESTINATIONS: Destination[] = [
  {
    slug: "coxs-bazar",
    name: "Cox's Bazar",
    division: "Chattogram",
    tagline: "The world's longest natural sea beach",
    image: "/images/destinations/coxs-bazar.jpg",
    propertyCount: 412,
    fromPrice: 2200,
    credit: {
      author: "Tanweer Morshed",
      license: "CC BY-SA 3.0",
      source: "https://commons.wikimedia.org/wiki/File:Cox%27s_Bazar_sea_beach_01.jpg",
    },
  },
  {
    slug: "sylhet",
    name: "Sylhet",
    division: "Sylhet",
    tagline: "Rolling tea gardens and hill streams",
    image: "/images/destinations/sylhet.jpg",
    propertyCount: 168,
    fromPrice: 1800,
    credit: {
      author: "Moheen Reeyad",
      license: "CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Tea_garden_at_Sripur_(1).jpg",
    },
  },
  {
    slug: "bandarban",
    name: "Bandarban",
    division: "Chattogram",
    tagline: "Cloud-level peaks in the Hill Tracts",
    image: "/images/destinations/bandarban.jpg",
    propertyCount: 94,
    fromPrice: 1500,
    credit: {
      author: "Tanvir Rahat",
      license: "CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Nilgiri,_Bandarban,_Bangladesh.jpg",
    },
  },
  {
    slug: "sundarbans",
    name: "Sundarbans",
    division: "Khulna",
    tagline: "Mangrove wilderness and river safaris",
    image: "/images/destinations/sundarbans.jpg",
    propertyCount: 47,
    fromPrice: 3400,
    credit: {
      author: "Kingshuk Mondal",
      license: "CC BY 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Dense_Mangrove_Forest_of_the_Sundarban_Tiger_Reserve_during_High_Tide,_West_Bengal,_India_03.jpg",
    },
  },
  {
    slug: "sreemangal",
    name: "Sreemangal",
    division: "Sylhet",
    tagline: "Tea capital, rainforest and misty mornings",
    image: "/images/destinations/sreemangal.jpg",
    propertyCount: 76,
    fromPrice: 1900,
    credit: {
      author: "Sumon Datta",
      license: "CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Lawachara_Forest.jpg",
    },
  },
  {
    slug: "saint-martin",
    name: "Saint Martin's Island",
    division: "Chattogram",
    tagline: "Coral island, turquoise water",
    image: "/images/destinations/saint-martin.jpg",
    propertyCount: 58,
    fromPrice: 2600,
    credit: {
      author: "ROCKY",
      license: "CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Saint_Martin_(6).jpg",
    },
  },
  {
    slug: "rangamati",
    name: "Rangamati",
    division: "Chattogram",
    tagline: "Kaptai Lake and the hanging bridge",
    image: "/images/destinations/rangamati.jpg",
    propertyCount: 63,
    fromPrice: 1600,
    credit: {
      author: "Shakhawat Hossen Shafat",
      license: "CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Hanging_Bridge,_Kaptai_Lake.jpg",
    },
  },
  {
    slug: "kuakata",
    name: "Kuakata",
    division: "Barishal",
    tagline: "Sunrise and sunset on one beach",
    image: "/images/destinations/kuakata.jpg",
    propertyCount: 39,
    fromPrice: 1700,
    credit: {
      author: "Fahimrb",
      license: "CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:Kuakata_Sea_Beach.JPG",
    },
  },
];

export const DESTINATION_MAP = new Map(DESTINATIONS.map((d) => [d.slug, d]));

export const getDestination = (slug: string) => DESTINATION_MAP.get(slug);
