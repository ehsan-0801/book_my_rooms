import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Button } from "@/components/ui/button";
import { getPropertyBySlug } from "@/lib/queries/storefront";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false },
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function parseDate(value: string | undefined, fallbackOffsetDays: number) {
  const d = value ? new Date(`${value}T00:00:00`) : undefined;
  if (d && !Number.isNaN(d.getTime())) return d;
  const out = new Date();
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() + fallbackOffsetDays);
  return out;
}

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;

  const property = await getPropertyBySlug(one(sp.property) ?? "");
  if (!property) notFound();

  const room =
    property.rooms.find((r) => r.slug === one(sp.room)) ?? property.rooms[0];

  const checkIn = parseDate(one(sp.checkIn), 7);
  let checkOut = parseDate(one(sp.checkOut), 9);
  // A checkout on or before check-in would make the stay zero nights.
  if (checkOut <= checkIn) {
    checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
  }

  const units = Math.min(
    Math.max(1, Number(one(sp.units) ?? 1) || 1),
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
