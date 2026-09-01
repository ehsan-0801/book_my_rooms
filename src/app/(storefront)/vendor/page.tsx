import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BedDouble,
  CalendarRange,
  CheckCircle2,
  Wallet,
} from "lucide-react";

import { Section, SectionHeader } from "@/components/site/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "List your property",
  description:
    "List your hotel, resort, cottage or homestay on Book My Rooms. No monthly fee — commission only on completed stays.",
};

const STEPS = [
  {
    title: "Register your business",
    body: "Owner details, trade licence and TIN. Takes about ten minutes.",
  },
  {
    title: "Get verified",
    body: "Our team reviews your documents and property, usually within two working days.",
  },
  {
    title: "Add rooms and rates",
    body: "Room types, photos, inventory and a pricing calendar you control.",
  },
  {
    title: "Start receiving bookings",
    body: "Confirmed bookings land in your dashboard and by SMS. Payouts twice a month.",
  },
];

const TOOLS = [
  { Icon: BedDouble, title: "Room & rate management", body: "Room types, bed configurations, photos and per-night pricing." },
  { Icon: CalendarRange, title: "Availability calendar", body: "Open, close or block dates and adjust inventory day by day." },
  { Icon: Wallet, title: "Earnings & payouts", body: "See gross bookings, commission and net payout for every settlement period." },
  { Icon: BarChart3, title: "Performance analytics", body: "Occupancy, average nightly rate, conversion and review scores." },
];

export default function VendorPage() {
  return (
    <>
      <section className="relative isolate">
        <Image
          src="/images/properties/hillside-retreat.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/60 to-black/35"
        />
        <Section className="py-14 sm:py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-shadow-hero text-sm font-semibold tracking-wider text-white/85 uppercase">
              For property owners
            </p>
            <h1 className="text-shadow-hero mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Fill more rooms, all year round
            </h1>
            <p className="text-shadow-hero mt-4 max-w-xl text-white/90 sm:text-lg">
              Reach travellers searching across all 64 districts. No listing fee,
              no monthly charge — you pay commission only on stays that actually
              happen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/vendor/register">List your property</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <Link href="/vendor/login">Vendor login</Link>
              </Button>
            </div>
          </div>
        </Section>
      </section>

      <Section className="py-12 sm:py-16">
        <SectionHeader
          eyebrow="How it works"
          title="Four steps to your first booking"
        />
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <section className="border-y bg-secondary/40 py-12 sm:py-16">
        <Section>
          <SectionHeader
            eyebrow="Your dashboard"
            title="Everything you need to run your listing"
          />
          <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.map(({ Icon, title, body }) => (
              <div key={title}>
                <span className="grid size-11 place-items-center rounded-xl bg-background text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <Section className="py-12 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Simple, transparent commission
            </h2>
            <p className="mt-3 text-muted-foreground">
              A flat commission on the room revenue of each completed stay.
              Nothing is charged on cancelled or no-show bookings, and the rate
              is fixed in your contract before you go live.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "No signup, listing or monthly fee",
                "Commission charged only after checkout",
                "Payouts on the 1st and 16th, direct to your bank",
                "Full earnings breakdown for every booking",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-7">
              <Link href="/vendor/register">Get started</Link>
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Example settlement
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Room revenue (3 nights)</dt>
                <dd className="tabular-nums">৳24,000</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Platform commission (15%)</dt>
                <dd className="tabular-nums text-offer">−৳3,600</dd>
              </div>
              <div className="flex justify-between gap-4 border-t pt-3 text-base font-bold">
                <dt>Your payout</dt>
                <dd className="tabular-nums text-price">৳20,400</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Taxes collected from the guest are remitted separately and are not
              part of your commission base.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
