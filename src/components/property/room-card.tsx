import Image from "next/image";
import { BedDouble, Croissant, Maximize, Users, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AmenityIcon } from "./amenity-icon";
import { amenityName } from "@/lib/amenities";
import { applyDiscount, bdt } from "@/lib/format";
import type { Room } from "@/lib/types";

export function RoomCard({
  room,
  propertySlug,
  destinationSlug,
}: {
  room: Room;
  propertySlug: string;
  destinationSlug: string;
}) {
  const finalPrice = applyDiscount(room.basePrice, room.discountPercent);
  const lowStock = room.unitsLeft <= 3;

  return (
    <article className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[12rem_1fr] sm:gap-5 lg:grid-cols-[13rem_1fr_13rem]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted sm:aspect-[4/3]">
        <Image
          src={room.image.url}
          alt={room.image.alt}
          fill
          sizes="(max-width: 640px) 100vw, 13rem"
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-semibold">{room.name}</h3>
        {room.description ? (
          <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
        ) : null}

        <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          <li className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4 shrink-0" aria-hidden />
            Up to {room.maxGuests} guest{room.maxGuests === 1 ? "" : "s"}
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="size-4 shrink-0" aria-hidden />
            {room.bedType}
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Maximize className="size-4 shrink-0" aria-hidden />
            {room.sizeSqft} sq ft
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Croissant className="size-4 shrink-0" aria-hidden />
            {room.breakfastIncluded ? "Breakfast included" : "Breakfast not included"}
          </li>
        </ul>

        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {room.amenities.map((slug) => (
            <li key={slug} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AmenityIcon slug={slug} className="size-3.5" />
              {amenityName(slug)}
            </li>
          ))}
        </ul>

        <p className="mt-3 flex items-center gap-1.5 text-xs">
          {room.isRefundable ? (
            <span className="font-medium text-success">Free cancellation available</span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-muted-foreground">
              <XCircle className="size-3.5" aria-hidden />
              Non-refundable rate
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 border-t pt-4 sm:col-span-2 sm:flex-row sm:items-end sm:justify-between lg:col-span-1 lg:flex-col lg:items-end lg:justify-end lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
        <div className="lg:text-right">
          {room.discountPercent ? (
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge className="bg-offer text-offer-foreground">{room.discountPercent}% off</Badge>
              <span className="text-sm text-muted-foreground line-through">
                {bdt(room.basePrice)}
              </span>
            </div>
          ) : null}
          <p className="mt-1 text-xl font-bold text-price">{bdt(finalPrice)}</p>
          <p className="text-xs text-muted-foreground">per night, excl. taxes</p>
          <p className="mt-1.5 text-xs font-medium">
            {lowStock ? (
              <span className="text-warning">Only {room.unitsLeft} left at this price</span>
            ) : (
              <span className="text-success">{room.unitsLeft} rooms available</span>
            )}
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto lg:w-full">
          <a
            href={`/checkout?property=${propertySlug}&destination=${destinationSlug}&room=${room.slug}`}
          >
            Reserve
          </a>
        </Button>
      </div>
    </article>
  );
}
