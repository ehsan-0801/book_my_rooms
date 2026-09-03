"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { DetailSkeleton } from "@/components/storefront/skeletons";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/api/client";
import type { Destination, Property } from "@/lib/types";

interface PropertyData {
  property: Property;
  destination: Destination | null;
}

function one(v: string | null) {
  return v ?? undefined;
}

function parseDate(value: string | undefined, fallbackOffsetDays: number) {
  const d = value ? new Date(`${value}T00:00:00`) : undefined;
  if (d && !Number.isNaN(d.getTime())) return d;
  const out = new Date();
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() + fallbackOffsetDays);
  return out;
}

export function CheckoutClient() {
  const params = useSearchParams();
  const slug = params.get("property") ?? "";

  const { data, loading, error } = useApi<PropertyData>(
    slug ? `/api/storefront/properties/${encodeURIComponent(slug)}` : null,
  );

  if (error?.status === 404) notFound();
  if (loading || !data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <DetailSkeleton />
      </div>
    );
  }
  if (!slug) notFound();

  const { property } = data;
  const room =
    property.rooms.find((r) => r.slug === one(params.get("room"))) ??
    property.rooms[0];

  const checkIn = parseDate(one(params.get("checkIn")), 7);
  let checkOut = parseDate(one(params.get("checkOut")), 9);
  // A checkout on or before check-in would make the stay zero nights.
  if (checkOut <= checkIn) {
    checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
  }

  const units = Math.min(
    Math.max(1, Number(one(params.get("units")) ?? 1) || 1),
    Math.max(1, room.unitsLeft),
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href={`/properties/${property.destinationSlug}/${property.slug}`}>
          <ArrowLeft className="size-4" aria-hidden />
          Back to {property.name}
        </Link>
      </Button>

      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        Secure checkout
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your rooms are held for 15 minutes while you complete payment.
      </p>

      <div className="mt-8">
        <CheckoutForm
          property={property}
          room={room}
          checkIn={checkIn}
          checkOut={checkOut}
          units={units}
        />
      </div>
    </div>
  );
}
