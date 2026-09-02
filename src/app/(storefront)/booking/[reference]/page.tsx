import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Printer,
  Users,
} from "lucide-react";

import { Steps } from "@/components/checkout/checkout-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { applyDiscount, bdt, formatDateLong, nightsBetween } from "@/lib/format";
import { getPropertyBySlug } from "@/lib/queries/storefront";

export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false },
};

const TAX_RATE = 0.15;

const METHOD_LABEL: Record<string, string> = {
  EPS: "EPS (Card / Internet Banking)",
  BKASH: "bKash",
  NAGAD: "Nagad",
  PAY_AT_HOTEL: "Pay at the property",
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

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: PageProps<"/booking/[reference]">) {
  const { reference } = await params;
  const sp = await searchParams;

  const property = await getPropertyBySlug(one(sp.property) ?? "");
  if (!property) notFound();

  const room = property.rooms.find((r) => r.slug === one(sp.room)) ?? property.rooms[0];
  const checkIn = parseDate(one(sp.checkIn), 7);
  let checkOut = parseDate(one(sp.checkOut), 9);
  if (checkOut <= checkIn) {
    checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
  }
  const units = Math.max(1, Number(one(sp.units) ?? 1) || 1);
  const method = one(sp.method) ?? "EPS";
  const nights = nightsBetween(checkIn, checkOut);

  const nightly = applyDiscount(room.basePrice, room.discountPercent);
  const listSubtotal = room.basePrice * nights * units;
  const roomDiscount = listSubtotal - nightly * nights * units;
  const subtotal = listSubtotal - roomDiscount;
  const taxes = Math.round(subtotal * TAX_RATE);
  const total = subtotal + taxes;

  const payAtHotel = method === "PAY_AT_HOTEL";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8">
        <Steps current={3} />
      </div>

      {/* Confirmation banner */}
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success text-white">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {payAtHotel ? "Booking requested" : "Booking confirmed"}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          {payAtHotel ? (
            <>
              {property.name} will confirm your reservation shortly. You&rsquo;ll
              pay the full amount at the property on arrival.
            </>
          ) : (
            <>
              Payment received. We&rsquo;ve emailed your confirmation and invoice,
              and sent an SMS to your mobile number.
            </>
          )}
        </p>

        <div className="mt-5 inline-flex flex-col items-center rounded-xl border bg-card px-6 py-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Booking reference
          </span>
          <span className="mt-0.5 font-mono text-xl font-bold tracking-wider">
            {reference}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="size-4" aria-hidden />
            Download invoice
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="size-4" aria-hidden />
            Print
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a
              href={`https://wa.me/8809610000000?text=Booking%20${reference}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp support
            </a>
          </Button>
        </div>
      </div>

      {/* Stay summary */}
      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:p-6">
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-auto sm:h-32 sm:w-44">
            <Image
              src={property.images[0].url}
              alt={property.images[0].alt}
              fill
              sizes="(max-width: 640px) 100vw, 11rem"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{property.typeLabel}</Badge>
              <Badge className={payAtHotel ? "bg-warning text-white" : "bg-success text-white"}>
                {payAtHotel ? "Awaiting property confirmation" : "Confirmed"}
              </Badge>
            </div>
            <h2 className="mt-2 text-lg font-semibold">
              <Link
                href={`/properties/${property.destinationSlug}/${property.slug}`}
                className="hover:underline"
              >
                {property.name}
              </Link>
            </h2>
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {property.addressLine}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              <a
                href={`tel:${property.contactPhone ?? "+8809610000000"}`}
                className="flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Phone className="size-3.5" aria-hidden />
                Call the property
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${property.coords.lat},${property.coords.lng}`}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <MapPin className="size-3.5" aria-hidden />
                Get directions
              </a>
            </div>
          </div>
        </div>

        <Separator />

        <dl className="grid gap-5 p-5 sm:grid-cols-3 sm:p-6">
          <div className="flex gap-2.5">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-xs text-muted-foreground">Check-in</dt>
              <dd className="text-sm font-medium">{formatDateLong(checkIn)}</dd>
              <dd className="text-xs text-muted-foreground">
                From {property.checkInTime}
              </dd>
            </div>
          </div>
          <div className="flex gap-2.5">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-xs text-muted-foreground">Check-out</dt>
              <dd className="text-sm font-medium">{formatDateLong(checkOut)}</dd>
              <dd className="text-xs text-muted-foreground">
                Until {property.checkOutTime}
              </dd>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Moon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-xs text-muted-foreground">Length of stay</dt>
              <dd className="text-sm font-medium">
                {nights} night{nights === 1 ? "" : "s"}
              </dd>
            </div>
          </div>
          <div className="flex gap-2.5 sm:col-span-2">
            <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-xs text-muted-foreground">Room</dt>
              <dd className="text-sm font-medium">{room.name}</dd>
              <dd className="text-xs text-muted-foreground">
                {units} room{units === 1 ? "" : "s"} · {room.bedType} ·{" "}
                {room.breakfastIncluded ? "breakfast included" : "room only"}
              </dd>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <dt className="text-xs text-muted-foreground">Payment method</dt>
              <dd className="text-sm font-medium">{METHOD_LABEL[method] ?? method}</dd>
            </div>
          </div>
        </dl>

        <Separator />

        {/* Invoice-style breakdown — SRS §25 */}
        <div className="p-5 sm:p-6">
          <h3 className="text-sm font-semibold">Payment summary</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {bdt(room.basePrice)} × {nights} night{nights === 1 ? "" : "s"} × {units} room
                {units === 1 ? "" : "s"}
              </dt>
              <dd className="tabular-nums">{bdt(listSubtotal)}</dd>
            </div>
            {roomDiscount > 0 ? (
              <div className="flex justify-between gap-4 text-offer">
                <dt>Property discount ({room.discountPercent}%)</dt>
                <dd className="tabular-nums">−{bdt(roomDiscount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Taxes &amp; fees (15%)</dt>
              <dd className="tabular-nums">{bdt(taxes)}</dd>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between gap-4 text-base font-bold">
              <dt>{payAtHotel ? "Payable at property" : "Total paid"}</dt>
              <dd className="tabular-nums">{bdt(total)}</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
            <strong className="font-semibold text-foreground">Cancellation:</strong>{" "}
            {property.cancellationPolicy}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href="/dashboard/bookings">View my bookings</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/properties">Book another stay</Link>
        </Button>
      </div>
    </div>
  );
}
