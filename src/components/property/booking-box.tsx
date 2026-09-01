"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Info, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyDiscount, bdt, formatDate, nightsBetween } from "@/lib/format";
import type { Property } from "@/lib/types";

const TAX_RATE = 0.15; // 15% VAT + service, shown before payment (SRS §72)

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export function BookingBox({ property }: { property: Property }) {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: addDays(today(), 7),
    to: addDays(today(), 9),
  }));
  const [roomSlug, setRoomSlug] = useState(property.rooms[0].slug);
  const [units, setUnits] = useState("1");

  const room = property.rooms.find((r) => r.slug === roomSlug) ?? property.rooms[0];
  const nights = range?.from && range?.to ? nightsBetween(range.from, range.to) : 0;
  const unitCount = Number(units);

  const totals = useMemo(() => {
    const n = Math.max(nights, 0) * unitCount;
    const nightly = applyDiscount(room.basePrice, room.discountPercent);
    // Bill from the list price and show the saving as its own line, so the
    // rows actually add up to the total the guest pays.
    const listSubtotal = room.basePrice * n;
    const discount = listSubtotal - nightly * n;
    const subtotal = listSubtotal - discount;
    const taxes = Math.round(subtotal * TAX_RATE);
    return { nightly, listSubtotal, discount, subtotal, taxes, total: subtotal + taxes };
  }, [room, nights, unitCount]);

  const stayLabel =
    range?.from && range?.to
      ? `${formatDate(range.from)} – ${formatDate(range.to)}`
      : "Select dates";

  const checkoutHref = `/checkout?property=${property.slug}&destination=${property.destinationSlug}&room=${room.slug}&units=${unitCount}${
    range?.from ? `&checkIn=${range.from.toISOString().slice(0, 10)}` : ""
  }${range?.to ? `&checkOut=${range.to.toISOString().slice(0, 10)}` : ""}`;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-price">{bdt(totals.nightly)}</span>
        <span className="text-sm text-muted-foreground">/ night</span>
      </div>
      {room.discountPercent ? (
        <p className="mt-0.5 text-sm text-muted-foreground">
          <span className="line-through">{bdt(room.basePrice)}</span>{" "}
          <span className="font-medium text-offer">
            Save {room.discountPercent}%
          </span>
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="bb-dates"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Dates
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="bb-dates"
                variant="outline"
                className="w-full justify-start gap-2 font-normal"
              >
                <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
                {stayLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                defaultMonth={range?.from}
                disabled={{ before: today() }}
                className="sm:[--cell-size:--spacing(9)]"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label
            htmlFor="bb-room"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Room type
          </label>
          <Select value={roomSlug} onValueChange={setRoomSlug}>
            <SelectTrigger id="bb-room" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {property.rooms.map((r) => (
                <SelectItem key={r.slug} value={r.slug}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="bb-units"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Rooms
          </label>
          <Select value={units} onValueChange={setUnits}>
            <SelectTrigger id="bb-units" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: Math.min(room.unitsLeft, 5) }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} room{n === 1 ? "" : "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {nights > 0 ? (
        <>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {bdt(room.basePrice)} × {nights} night{nights === 1 ? "" : "s"}
                {unitCount > 1 ? ` × ${unitCount} rooms` : ""}
              </dt>
              <dd className="tabular-nums">{bdt(totals.listSubtotal)}</dd>
            </div>
            {totals.discount > 0 ? (
              <div className="flex justify-between gap-4 text-offer">
                <dt>Discount ({room.discountPercent}%)</dt>
                <dd className="tabular-nums">−{bdt(totals.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1 text-muted-foreground">
                Taxes &amp; fees
                <Info className="size-3.5" aria-hidden />
              </dt>
              <dd className="tabular-nums">{bdt(totals.taxes)}</dd>
            </div>
            <Separator />
            <div className="flex justify-between gap-4 text-base font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{bdt(totals.total)}</dd>
            </div>
          </dl>
        </>
      ) : null}

      <Button asChild size="lg" className="mt-4 w-full" disabled={nights === 0}>
        <Link href={checkoutHref}>
          {nights === 0 ? "Select dates to continue" : "Reserve now"}
        </Link>
      </Button>

      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
        You won&rsquo;t be charged until the property confirms. Paid securely via EPS.
      </p>
    </div>
  );
}
