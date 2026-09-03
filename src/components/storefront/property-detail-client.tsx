"use client";

import Link from "next/link";
import {
  Clock,
  Heart,
  MapPin,
  Navigation,
  Share2,
  ShieldAlert,
  Star,
} from "lucide-react";

import { AmenityIcon } from "@/components/property/amenity-icon";
import { BookingBox } from "@/components/property/booking-box";
import { Gallery } from "@/components/property/gallery";
import { RatingStars } from "@/components/property/rating-stars";
import { RoomCard } from "@/components/property/room-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bdt, lowestRate, ratingLabel } from "@/lib/format";

// Only published listings from approved vendors are pre-rendered; anything
// else 404s until it is approved.
import { notFound } from "next/navigation";
import { DetailSkeleton } from "@/components/storefront/skeletons";
import { useApi } from "@/lib/api/client";
import type { Destination, Property } from "@/lib/types";

interface DetailData {
  property: Property;
  destination: Destination | null;
}

export function PropertyDetailClient({ slug }: { slug: string }) {
  const { data, loading, error } = useApi<DetailData>(
    `/api/storefront/properties/${encodeURIComponent(slug)}`,
  );

  // The endpoint only returns published listings from approved vendors, so a
  // 404 here means the same thing it meant when this page was server-rendered.
  if (error?.status === 404) notFound();
  if (loading || !data) return <DetailSkeleton />;

  return <PropertyDetail property={data.property} destination={data.destination} />;
}

function PropertyDetail({
  property,
  destination,
}: {
  property: Property;
  destination: Destination | null;
}) {
  const distribution = ratingDistribution(property.reviews.map((r) => r.rating));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/destinations/${property.destinationSlug}`}>
                {destination?.name ?? property.district}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1">{property.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title block */}
      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{property.typeLabel}</Badge>
            <Badge variant="outline" className="capitalize">{property.category}</Badge>
            {property.isPremium ? <Badge>Premium</Badge> : null}
            <span className="flex items-center gap-0.5" aria-label={`${property.starRating} star property`}>
              {Array.from({ length: property.starRating }, (_, i) => (
                <Star key={i} className="size-3.5 fill-rating text-rating" aria-hidden />
              ))}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            {property.name}
          </h1>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {property.addressLine}
            </span>
            <a href="#location" className="font-medium text-primary hover:underline">
              Show on map
            </a>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex h-8 min-w-10 items-center justify-center rounded-md bg-primary px-2 text-sm font-semibold text-primary-foreground tabular-nums">
              {property.ratingAvg.toFixed(1)}
            </span>
            <span className="text-sm">
              <span className="font-semibold">{ratingLabel(property.ratingAvg)}</span>{" "}
              <span className="text-muted-foreground">
                · {property.ratingCount.toLocaleString("en-BD")} verified reviews
              </span>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="size-4" aria-hidden />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Heart className="size-4" aria-hidden />
            Save
          </Button>
        </div>
      </header>

      {/* Gallery */}
      <div className="relative mt-5">
        <Gallery images={property.images} propertyName={property.name} />
      </div>

      {/* Main + sidebar */}
      <div className="mt-8 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-10">
          {/* Overview */}
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-xl font-bold">
              About this {property.typeLabel.toLowerCase()}
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {property.description}
            </p>

            <dl className="mt-5 grid gap-4 rounded-xl border bg-secondary/30 p-4 sm:grid-cols-3">
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="text-sm font-medium">Check-in</dt>
                  <dd className="text-sm text-muted-foreground">
                    From {property.checkInTime}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="text-sm font-medium">Check-out</dt>
                  <dd className="text-sm text-muted-foreground">
                    Until {property.checkOutTime}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="text-sm font-medium">Cancellation</dt>
                  <dd className="text-sm text-muted-foreground">
                    {property.cancellationPolicy}
                  </dd>
                </div>
              </div>
            </dl>
          </section>

          {/* Amenities */}
          <section aria-labelledby="amenities-heading">
            <h2 id="amenities-heading" className="text-xl font-bold">
              Amenities
            </h2>
            <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {property.amenities.map((amenity) => (
                <li key={amenity.slug} className="flex items-center gap-2.5 text-sm">
                  <AmenityIcon icon={amenity.icon} className="text-primary" />
                  {amenity.name}
                </li>
              ))}
            </ul>
          </section>

          {/* Rooms */}
          <section aria-labelledby="rooms-heading">
            <h2 id="rooms-heading" className="text-xl font-bold">
              Available rooms
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Prices shown are per night for your selected dates, excluding taxes and fees.
            </p>
            <div className="mt-4 space-y-4">
              {property.rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  propertySlug={property.slug}
                  destinationSlug={property.destinationSlug}
                />
              ))}
            </div>
          </section>

          {/* Location */}
          <section id="location" aria-labelledby="location-heading" className="scroll-mt-24">
            <h2 id="location-heading" className="text-xl font-bold">
              Location
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{property.addressLine}</p>

            <div className="mt-4 overflow-hidden rounded-xl border">
              {/* Static OSM embed — swap for the Google Maps JS API once a key
                  is configured (SRS §60). No key needed for this view. */}
              <iframe
                title={`Map showing ${property.name}`}
                loading="lazy"
                className="h-64 w-full border-0 sm:h-80"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  property.coords.lng - 0.04
                }%2C${property.coords.lat - 0.03}%2C${property.coords.lng + 0.04}%2C${
                  property.coords.lat + 0.03
                }&layer=mapnik&marker=${property.coords.lat}%2C${property.coords.lng}`}
              />
              <div className="flex items-center justify-between gap-3 border-t bg-card px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {property.area}, {property.district}
                </p>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${property.coords.lat},${property.coords.lng}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Navigation className="size-4" aria-hidden />
                    Directions
                  </a>
                </Button>
              </div>
            </div>

            {/* Nearby — SRS §13.6 */}
            <h3 className="mt-6 text-base font-semibold">What&rsquo;s nearby</h3>
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {property.nearby.map((n) => (
                <li
                  key={n.name}
                  className="flex items-center justify-between gap-4 border-b py-2 text-sm last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{n.name}</span>
                    <span className="text-xs text-muted-foreground">{n.category}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {n.distanceKm} km
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Reviews */}
          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="text-xl font-bold">
              Guest reviews
            </h2>

            <div className="mt-4 grid gap-6 rounded-xl border p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
              <div className="text-center sm:text-left">
                <p className="text-4xl font-bold tabular-nums">
                  {property.ratingAvg.toFixed(1)}
                </p>
                <RatingStars rating={property.ratingAvg} className="mt-1.5" />
                <p className="mt-1 text-sm font-medium">{ratingLabel(property.ratingAvg)}</p>
                <p className="text-xs text-muted-foreground">
                  {property.ratingCount.toLocaleString("en-BD")} reviews
                </p>
              </div>

              <dl className="space-y-1.5">
                {distribution.map(({ stars, pct }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <dt className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">
                      {stars} star
                    </dt>
                    <dd className="flex flex-1 items-center gap-3">
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <span
                          className="block h-full rounded-full bg-rating"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                        {pct}%
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <ul className="mt-5 space-y-4">
              {property.reviews.map((r) => (
                <li key={r.id} className="rounded-xl border bg-card p-5">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                    >
                      {r.avatarInitials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{r.author}</p>
                        <p className="text-xs text-muted-foreground">{r.date}</p>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <RatingStars rating={r.rating} size={13} />
                        <span className="text-xs text-muted-foreground">
                          Stayed in {r.stayedIn}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">{r.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {r.comment}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Policies */}
          <section aria-labelledby="policies-heading">
            <h2 id="policies-heading" className="text-xl font-bold">
              Policies &amp; house rules
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Property policies</h3>
                <ul className="mt-2 space-y-2">
                  {property.policies.map((p) => (
                    <li key={p} className="text-sm text-muted-foreground">
                      • {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold">House rules</h3>
                <ul className="mt-2 space-y-2">
                  {property.rules.map((r) => (
                    <li key={r} className="text-sm text-muted-foreground">
                      • {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky booking sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <BookingBox property={property} />
          </div>
        </aside>
      </div>

      {/* Mobile sticky reserve bar */}
      <div
        data-mobile-actionbar
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur lg:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-price">
              {bdt(lowestRate(property))}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                / night
              </span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {property.ratingAvg.toFixed(1)} · {ratingLabel(property.ratingAvg)}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <a href="#rooms-heading">Choose a room</a>
          </Button>
        </div>
      </div>
      {/* Spacer so the sticky bar never covers the last section on mobile */}
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}

/** Approximate the star split from the sample reviews we have. */
function ratingDistribution(ratings: number[]) {
  const total = ratings.length || 1;
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    pct: Math.round((ratings.filter((r) => r === stars).length / total) * 100),
  }));
}

