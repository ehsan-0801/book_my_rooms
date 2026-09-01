"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Moon,
  Tag,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { applyDiscount, bdt, formatDateLong, nightsBetween } from "@/lib/format";
import type { Property, Room } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAX_RATE = 0.15;

const PAYMENT_METHODS = [
  {
    value: "EPS",
    label: "EPS (Card & Internet Banking)",
    hint: "Visa, Mastercard, AmEx and all major Bangladeshi banks",
    recommended: true,
  },
  { value: "BKASH", label: "bKash", hint: "Pay from your bKash wallet" },
  { value: "NAGAD", label: "Nagad", hint: "Pay from your Nagad wallet" },
  {
    value: "PAY_AT_HOTEL",
    label: "Pay at the property",
    hint: "Reserve now, pay on arrival. Subject to property approval.",
  },
];

/** Demo coupons so the discount path is exercisable in the prototype. */
const COUPONS: Record<string, { type: "PERCENTAGE" | "FLAT"; value: number; label: string }> = {
  BMR10: { type: "PERCENTAGE", value: 10, label: "10% off your first booking" },
  MONSOON500: { type: "FLAT", value: 500, label: "৳500 off monsoon stays" },
};

export function CheckoutForm({
  property,
  room,
  checkIn,
  checkOut,
  units,
}: {
  property: Property;
  room: Room;
  checkIn: Date;
  checkOut: Date;
  units: number;
}) {
  const router = useRouter();
  const [method, setMethod] = useState("EPS");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; label: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  const nights = nightsBetween(checkIn, checkOut);

  const totals = useMemo(() => {
    const n = nights * units;
    const nightly = applyDiscount(room.basePrice, room.discountPercent);
    const listSubtotal = room.basePrice * n;
    const roomDiscount = listSubtotal - nightly * n;
    const afterRoom = listSubtotal - roomDiscount;
    const couponAmount = coupon?.amount ?? 0;
    const subtotal = Math.max(0, afterRoom - couponAmount);
    const taxes = Math.round(subtotal * TAX_RATE);
    return { nightly, listSubtotal, roomDiscount, couponAmount, subtotal, taxes, total: subtotal + taxes };
  }, [room, nights, units, coupon]);

  function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    const found = COUPONS[code];
    if (!found) {
      setCoupon(null);
      setCouponError("That code isn't valid or has expired.");
      return;
    }
    const base = totals.listSubtotal - totals.roomDiscount;
    const amount =
      found.type === "PERCENTAGE" ? Math.round((base * found.value) / 100) : found.value;
    setCoupon({ code, label: found.label, amount });
    setCouponError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Design prototype: the real flow creates a PENDING booking, holds
    // inventory, then redirects to the EPS hosted payment page.
    const reference = `BMR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    setTimeout(() => {
      router.push(
        `/booking/${reference}?property=${property.slug}&destination=${property.destinationSlug}&room=${room.slug}` +
          `&checkIn=${checkIn.toISOString().slice(0, 10)}&checkOut=${checkOut.toISOString().slice(0, 10)}` +
          `&units=${units}&method=${method}${coupon ? `&coupon=${coupon.code}` : ""}`,
      );
    }, 900);
  }

  return (
    <form onSubmit={submit} className="lg:grid lg:grid-cols-[1fr_23rem] lg:items-start lg:gap-8">
      {/* ------------------------------------------------ left: the form */}
      <div className="min-w-0 space-y-8">
        <Steps current={2} />

        <section aria-labelledby="guest-heading" className="rounded-xl border bg-card p-5 sm:p-6">
          <h2 id="guest-heading" className="text-lg font-semibold">
            Guest details
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The lead guest must present a matching photo ID at check-in.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="guest-name" label="Full name" required autoComplete="name" placeholder="e.g. Nusrat Jahan" />
            <Field id="guest-phone" label="Mobile number" required type="tel" autoComplete="tel" placeholder="01XXXXXXXXX" />
            <div className="sm:col-span-2">
              <Field
                id="guest-email"
                label="Email address"
                required
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                hint="Your confirmation and invoice are sent here."
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="special-request">
                Special requests <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="special-request"
                className="mt-1.5 min-h-24"
                placeholder="Late check-in, adjoining rooms, high floor…"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Requests are passed to the property but can&rsquo;t be guaranteed.
              </p>
            </div>
          </div>
        </section>

        {/* Payment — SRS §22 */}
        <section aria-labelledby="payment-heading" className="rounded-xl border bg-card p-5 sm:p-6">
          <h2 id="payment-heading" className="text-lg font-semibold">
            Payment method
          </h2>

          <RadioGroup value={method} onValueChange={setMethod} className="mt-4 gap-3">
            {PAYMENT_METHODS.map((m) => (
              <Label
                key={m.value}
                htmlFor={`pay-${m.value}`}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  method === m.value
                    ? "border-primary bg-secondary/50 ring-1 ring-primary"
                    : "hover:bg-secondary/30",
                )}
              >
                <RadioGroupItem value={m.value} id={`pay-${m.value}`} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{m.label}</span>
                    {m.recommended ? (
                      <Badge variant="secondary" className="text-[10px]">Recommended</Badge>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {m.hint}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>

          <p className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
            You&rsquo;ll be redirected to EPS to complete payment. Book My Rooms
            never sees or stores your card details.
          </p>
        </section>

        {/* Terms */}
        <div className="flex items-start gap-3 rounded-xl border bg-card p-5">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="agree" className="text-sm leading-relaxed font-normal">
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              booking terms
            </Link>
            , the{" "}
            <Link href="/refund-policy" className="font-medium text-primary hover:underline">
              cancellation and refund policy
            </Link>
            , and this property&rsquo;s house rules.
          </Label>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 lg:hidden"
          disabled={!agreed || submitting}
        >
          {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <CreditCard aria-hidden />}
          {submitting ? "Redirecting to EPS…" : `Pay ${bdt(totals.total)}`}
        </Button>
      </div>

      {/* ------------------------------------------- right: order summary */}
      <aside className="mt-8 lg:mt-0">
        <div className="sticky top-24 space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="flex gap-3 p-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={property.images[0].url}
                  alt={property.images[0].alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{property.typeLabel}</p>
                <h2 className="line-clamp-2 text-sm font-semibold">{property.name}</h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{property.area}, {property.district}</span>
                </p>
              </div>
            </div>

            <Separator />

            <dl className="space-y-3 p-4 text-sm">
              <div className="flex gap-2.5">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-medium">{formatDateLong(checkIn)}</dt>
                  <dd className="text-xs text-muted-foreground">
                    to {formatDateLong(checkOut)}
                  </dd>
                </div>
              </div>
              <div className="flex gap-2.5">
                <Moon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-medium">
                    {nights} night{nights === 1 ? "" : "s"}
                  </dt>
                  <dd className="text-xs text-muted-foreground">
                    Check-in from {property.checkInTime} · out by {property.checkOutTime}
                  </dd>
                </div>
              </div>
              <div className="flex gap-2.5">
                <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <dt className="font-medium">{room.name}</dt>
                  <dd className="text-xs text-muted-foreground">
                    {units} room{units === 1 ? "" : "s"} · up to {room.maxGuests * units} guests
                  </dd>
                </div>
              </div>
            </dl>

            <Separator />

            {/* Coupon */}
            <div className="p-4">
              <Label htmlFor="coupon" className="text-xs font-semibold tracking-wide uppercase">
                Promo code
              </Label>
              <div className="mt-2 flex gap-2">
                <Input
                  id="coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="BMR10"
                  className="h-9 uppercase"
                  aria-describedby={couponError ? "coupon-error" : undefined}
                  aria-invalid={Boolean(couponError)}
                />
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={applyCoupon}>
                  Apply
                </Button>
              </div>
              {couponError ? (
                <p id="coupon-error" role="alert" className="mt-1.5 text-xs text-destructive">
                  {couponError}
                </p>
              ) : null}
              {coupon ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
                  <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
                  {coupon.code} applied — {coupon.label}
                </p>
              ) : null}
            </div>

            <Separator />

            {/* Price breakdown */}
            <dl className="space-y-2 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {bdt(room.basePrice)} × {nights} × {units}
                </dt>
                <dd className="tabular-nums">{bdt(totals.listSubtotal)}</dd>
              </div>
              {totals.roomDiscount > 0 ? (
                <div className="flex justify-between gap-4 text-offer">
                  <dt>Property discount ({room.discountPercent}%)</dt>
                  <dd className="tabular-nums">−{bdt(totals.roomDiscount)}</dd>
                </div>
              ) : null}
              {totals.couponAmount > 0 ? (
                <div className="flex justify-between gap-4 text-offer">
                  <dt className="flex items-center gap-1">
                    <Tag className="size-3.5" aria-hidden />
                    Promo {coupon?.code}
                  </dt>
                  <dd className="tabular-nums">−{bdt(totals.couponAmount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Taxes &amp; fees (15%)</dt>
                <dd className="tabular-nums">{bdt(totals.taxes)}</dd>
              </div>

              <Separator className="my-1" />

              <div className="flex justify-between gap-4 text-base font-bold">
                <dt>Total payable</dt>
                <dd className="tabular-nums">{bdt(totals.total)}</dd>
              </div>
            </dl>
          </div>

          <Button
            type="submit"
            size="lg"
            className="hidden w-full gap-2 lg:inline-flex"
            disabled={!agreed || submitting}
          >
            {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <CreditCard aria-hidden />}
            {submitting ? "Redirecting to EPS…" : `Pay ${bdt(totals.total)}`}
          </Button>

          {!agreed ? (
            <p className="text-center text-xs text-muted-foreground">
              Accept the booking terms to continue.
            </p>
          ) : null}
        </div>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & { id: string; label: string; hint?: string }) {
  return (
    <div>
      <Label htmlFor={id}>
        {label}
        {props.required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input id={id} className="mt-1.5" {...props} />
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Choose your room", "Guest details & payment", "Confirmation"];
  return (
    <div>
      {/* On narrow screens the rail collapses to numbers, so name the current
          step underneath rather than leaving it unlabelled. */}
      <p className="mb-3 text-sm font-semibold sm:hidden">
        Step {current} of {steps.length}
        <span className="font-normal text-muted-foreground"> · {steps[current - 1]}</span>
      </p>
      <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span
              aria-hidden
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
                state === "done" && "bg-success text-white",
                state === "current" && "bg-primary text-primary-foreground",
                state === "todo" && "bg-secondary text-muted-foreground",
              )}
            >
              {state === "done" ? <BadgeCheck className="size-4" /> : n}
            </span>
            <span
              className={cn(
                "hidden truncate text-sm sm:block",
                state === "current" ? "font-semibold" : "text-muted-foreground",
              )}
            >
              {label}
              {state === "current" ? <span className="sr-only"> (current step)</span> : null}
            </span>
            {n < steps.length ? (
              <span aria-hidden className="hidden h-px flex-1 bg-border sm:block" />
            ) : null}
          </li>
        );
      })}
      </ol>
    </div>
  );
}
