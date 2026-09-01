import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AmenityIcon } from "./amenity-icon";
import { RatingBadge } from "./rating-stars";
import { amenityName } from "@/lib/amenities";
import { bdt, ratingLabel } from "@/lib/format";
import { lowestRate } from "@/lib/properties";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";

export function propertyHref(p: Property) {
  return `/properties/${p.destinationSlug}/${p.slug}`;
}

/**
 * `layout="grid"`  — image on top, used on the homepage rails and grids.
 * `layout="row"`   — image beside the detail, used on the search results page
 *                    from `sm` up; it collapses back to the grid shape on mobile.
 */
export function PropertyCard({
  property,
  layout = "grid",
  priority = false,
  className,
}: {
  property: Property;
  layout?: "grid" | "row";
  priority?: boolean;
  className?: string;
}) {
  const from = lowestRate(property);
  const wasPrice = property.discountPercent
    ? property.basePrice
    : undefined;
  const cover = property.images[0];
  const isRow = layout === "row";
  const topAmenities = property.amenities.slice(0, 4);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md",
        isRow && "sm:flex-row",
        className,
      )}
    >
      {/* Media */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-muted",
          isRow ? "aspect-[16/10] sm:aspect-auto sm:w-64 lg:w-72" : "aspect-[4/3]",
        )}
      >
        <Image
          src={cover.url}
          alt={cover.alt}
          fill
          priority={priority}
          sizes={
            isRow
              ? "(max-width: 640px) 100vw, (max-width: 1024px) 16rem, 18rem"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {property.discountPercent ? (
              <Badge className="bg-offer text-offer-foreground shadow-sm">
                {property.discountPercent}% off
              </Badge>
            ) : null}
            {property.isPremium ? (
              <Badge variant="secondary" className="shadow-sm backdrop-blur">
                Premium
              </Badge>
            ) : null}
          </div>

          <Button
            variant="secondary"
            size="icon"
            aria-label={`Save ${property.name} to wishlist`}
            className="size-8 rounded-full bg-background/85 shadow-sm backdrop-blur hover:bg-background"
          >
            <Heart className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              {property.typeLabel}
              <span className="mx-1.5" aria-hidden>·</span>
              <span className="capitalize">{property.category}</span>
            </p>

            <h3 className="mt-1 text-base leading-snug font-semibold">
              {/* Stretched link keeps the whole card clickable without nesting
                  the wishlist and compare buttons inside an anchor. */}
              <Link href={propertyHref(property)} className="after:absolute after:inset-0">
                {property.name}
              </Link>
            </h3>

            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">
                {property.area}, {property.district}
              </span>
            </p>
          </div>

          {isRow ? (
            <div className="hidden shrink-0 text-right sm:block">
              <RatingBadge rating={property.ratingAvg} />
              <p className="mt-1 text-xs font-medium">{ratingLabel(property.ratingAvg)}</p>
              <p className="text-xs text-muted-foreground">
                {property.ratingCount.toLocaleString("en-BD")} reviews
              </p>
            </div>
          ) : null}
        </div>

        {isRow ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {property.shortDescription}
          </p>
        ) : null}

        {/* Amenities */}
        <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {topAmenities.map((slug) => (
            <li
              key={slug}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <AmenityIcon slug={slug} className="size-3.5" />
              {amenityName(slug)}
            </li>
          ))}
          {property.amenities.length > topAmenities.length ? (
            <li className="text-xs font-medium text-primary">
              +{property.amenities.length - topAmenities.length} more
            </li>
          ) : null}
        </ul>

        {/* Price row */}
        <div className="mt-4 flex items-end justify-between gap-3 pt-3 border-t">
          <div className="min-w-0">
            {!isRow ? (
              <div className="mb-1.5 flex items-center gap-1.5">
                <RatingBadge rating={property.ratingAvg} count={property.ratingCount} />
              </div>
            ) : null}
            <div className="flex flex-wrap items-baseline gap-x-2">
              {wasPrice ? (
                <span className="text-sm text-muted-foreground line-through">
                  {bdt(wasPrice)}
                </span>
              ) : null}
              <span className="text-lg font-bold text-price">{bdt(from)}</span>
              <span className="text-xs text-muted-foreground">/ night</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Excludes taxes &amp; fees
            </p>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              aria-label={`Compare ${property.name}`}
              className="size-9"
            >
              <Scale className="size-4" aria-hidden />
            </Button>
            <Button asChild size="sm" className="h-9">
              <Link href={propertyHref(property)}>View</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
