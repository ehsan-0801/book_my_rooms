import { ShieldCheck, Sparkles, Zap } from "lucide-react";
import { HeroSlider, type HeroSlide } from "./hero-slider";
import { SearchBar } from "@/components/search/search-bar";

const TRUST = [
  { Icon: Zap, label: "Instant confirmation" },
  { Icon: ShieldCheck, label: "Secure EPS payment" },
  { Icon: Sparkles, label: "Verified properties" },
];

/**
 * Real destinations from the catalogue rather than stock scenery, so the hero
 * shows places a visitor can actually book. Ordered to move around the
 * country: coast, beach, tea country, island, hills.
 */
const SLIDES: HeroSlide[] = [
  {
    src: "/images/hero.jpg",
    label: "Beachfront resorts",
    region: "Across Bangladesh",
    alt: "Aerial view of a resort pool overlooking the sea",
  },
  {
    src: "/images/destinations/coxs-bazar.jpg",
    label: "Cox's Bazar",
    region: "Chattogram Division",
    alt: "Sunset over the sea beach at Cox's Bazar",
  },
  {
    src: "/images/destinations/sylhet.jpg",
    label: "Sylhet",
    region: "Sylhet Division",
    alt: "Rolling tea gardens in Sylhet",
  },
  {
    src: "/images/destinations/saint-martin.jpg",
    label: "Saint Martin's Island",
    region: "Chattogram Division",
    alt: "Fishing boat on the shore of Saint Martin's Island",
  },
  {
    src: "/images/destinations/bandarban.jpg",
    label: "Bandarban",
    region: "Chattogram Hill Tracts",
    alt: "Layered hills stretching to the horizon in Bandarban",
  },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <HeroSlider slides={SLIDES} />

      {/*
        Two crossed gradients rather than one flat scrim: the horizontal pass
        protects the left-aligned copy across every slide, the vertical pass
        seats the search card, and the open sky on the right stays bright.
      */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/50 to-black/20"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-transparent to-black/30"
      />

      <div className="mx-auto w-full max-w-7xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20 lg:px-8 lg:pt-28 lg:pb-16">
        <div className="max-w-3xl">
          <p className="text-shadow-hero text-sm font-semibold tracking-wider text-white/85 uppercase">
            Bangladesh&rsquo;s smart booking platform
          </p>
          <h1 className="text-shadow-hero mt-3 text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find your perfect stay
          </h1>
          <p className="text-shadow-hero mt-4 max-w-xl text-base text-white/90 sm:text-lg">
            Hotels, resorts, cottages, villas and homestays from Cox&rsquo;s Bazar
            to the Hill Tracts — compared side by side, with live availability.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {TRUST.map(({ Icon, label }) => (
              <li
                key={label}
                className="text-shadow-hero flex items-center gap-2 text-sm font-medium text-white/90"
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <SearchBar className="mt-8 lg:mt-10" />
      </div>
    </section>
  );
}
