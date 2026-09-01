import Image from "next/image";
import Link from "next/link";
import { bdt } from "@/lib/format";
import type { Destination } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DestinationCard({
  destination,
  size = "default",
  className,
}: {
  destination: Destination;
  size?: "default" | "tall";
  className?: string;
}) {
  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className={cn(
        "group relative isolate flex flex-col justify-end overflow-hidden rounded-xl",
        size === "tall" ? "aspect-[3/4]" : "aspect-[4/3]",
        className,
      )}
    >
      <Image
        src={destination.image}
        alt={`${destination.name}, ${destination.division}`}
        fill
        sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 25vw"
        className="-z-10 object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
      />

      <div className="p-4">
        <h3 className="text-shadow-hero text-lg font-semibold text-white">
          {destination.name}
        </h3>
        <p className="text-shadow-hero mt-0.5 line-clamp-1 text-sm text-white/85">
          {destination.tagline}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-white/80">
          <span>{destination.propertyCount} properties</span>
          <span aria-hidden>·</span>
          <span>from {bdt(destination.fromPrice)}</span>
        </p>
      </div>
    </Link>
  );
}
