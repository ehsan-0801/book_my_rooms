import Image from "next/image";
import { ShieldCheck, Sparkles, Zap } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";

const TRUST = [
  { Icon: Zap, label: "Instant confirmation" },
  { Icon: ShieldCheck, label: "Secure EPS payment" },
  { Icon: Sparkles, label: "Verified properties" },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      {/* Two-stop scrim: dark enough for AA text at the top, lighter at the
          base so the search card doesn't sit on a muddy band. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/25"
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
