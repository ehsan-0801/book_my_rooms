import type { Metadata } from "next";
import { TicketPercent } from "lucide-react";

import { PropertyCard } from "@/components/property/property-card";
import { Section, SectionHeader } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { discountedProperties } from "@/lib/properties";

export const metadata: Metadata = {
  title: "Special offers",
  description:
    "Seasonal and vendor discounts on hotels, resorts and homestays across Bangladesh.",
};

const CAMPAIGNS = [
  {
    code: "BMR10",
    title: "10% off your first booking",
    body: "New to Book My Rooms? Apply this at checkout on any stay.",
    expiry: "Valid until 31 Dec 2026",
  },
  {
    code: "MONSOON500",
    title: "৳500 off monsoon stays",
    body: "On bookings of two nights or more in Sylhet and Sreemangal.",
    expiry: "Valid until 30 Sep 2026",
  },
];

export default function OffersPage() {
  const offers = discountedProperties();

  return (
    <>
      <div className="border-b bg-secondary/40">
        <Section className="py-10 sm:py-14">
          <Badge className="bg-offer text-offer-foreground">
            <TicketPercent className="mr-1 size-3.5" aria-hidden />
            Limited time
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Special offers
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Discounts set by the properties themselves, plus platform-wide promo
            codes. Both stack — the property discount applies first.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {CAMPAIGNS.map((c) => (
              <div
                key={c.code}
                className="rounded-xl border border-dashed border-primary/40 bg-card p-5"
              >
                <p className="font-mono text-lg font-bold tracking-wider text-primary">
                  {c.code}
                </p>
                <h2 className="mt-1 text-sm font-semibold">{c.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{c.expiry}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section className="py-10 sm:py-14">
        <SectionHeader
          title="Discounted properties"
          description={`${offers.length} properties currently running a discount.`}
        />
        <div className="mt-6 grid gap-4">
          {offers.map((p, i) => (
            <PropertyCard key={p.id} property={p} layout="row" priority={i < 2} />
          ))}
        </div>
      </Section>
    </>
  );
}
