"use client";

import { TicketPercent } from "lucide-react";

import { Hero } from "@/components/home/hero";
import { PropertyTypeStrip, type PropertyTypeOption } from "@/components/home/property-type-strip";
import { DestinationCard } from "@/components/home/destination-card";
import { ReviewCard } from "@/components/home/review-card";
import { VendorCta } from "@/components/home/vendor-cta";
import { WhyUs } from "@/components/home/why-us";
import { PropertyCard } from "@/components/property/property-card";
import { CardRail, Section, SectionHeader } from "@/components/site/section";
import { CardGridSkeleton, HeroSkeleton, RailSkeleton } from "@/components/storefront/skeletons";
import { useApi } from "@/lib/api/client";
import type { Destination, Property } from "@/lib/types";

interface HomeData {
  destinations: Destination[];
  propertyTypes: PropertyTypeOption[];
  featured: Property[];
  offers: Property[];
  budget: Property[];
  eco: Property[];
  reviews: React.ComponentProps<typeof ReviewCard>["review"][];
}

export function HomeClient() {
  const { data, loading } = useApi<HomeData>("/api/storefront/home");

  if (loading || !data) return <HomeSkeleton />;

  return (
    <>
      <Hero destinations={data.destinations} />

      <Section className="py-10 sm:py-12">
        <PropertyTypeStrip types={data.propertyTypes} />
      </Section>

      <Section className="pb-12 sm:pb-16">
        <SectionHeader
          eyebrow="Where to next"
          title="Popular destinations"
          description="From the world's longest sea beach to tea gardens and cloud-level ridges."
          href="/destinations"
        />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {data.destinations.slice(0, 8).map((d) => (
            <DestinationCard key={d.slug} destination={d} />
          ))}
        </div>
      </Section>

      <Section className="pb-12 sm:pb-16">
        <SectionHeader
          eyebrow="Handpicked"
          title="Featured properties"
          description="Reviewed by our team and consistently rated highly by guests."
          href="/properties?sort=featured"
        />
        <CardRail className="mt-6">
          {data.featured.map((p, i) => (
            <PropertyCard key={p.id} property={p} priority={i < 3} />
          ))}
        </CardRail>
      </Section>

      <section className="bg-secondary/40 py-12 sm:py-16">
        <Section>
          <SectionHeader
            eyebrow={
              <>
                <TicketPercent className="mr-1 inline size-3.5" aria-hidden />
                Limited time
              </>
            }
            title="Special offers"
            description="Seasonal and vendor discounts, applied automatically at checkout."
            href="/offers"
          />
          <CardRail className="mt-6">
            {data.offers.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </CardRail>
        </Section>
      </section>

      <Section className="py-12 sm:py-16">
        <SectionHeader
          eyebrow="Under ৳5,500 a night"
          title="Budget stays that don't feel like it"
          description="Clean, well-reviewed rooms at prices that hold through peak season."
          href="/properties?category=budget"
        />
        <CardRail className="mt-6">
          {data.budget.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </CardRail>
      </Section>

      <section className="border-y bg-card py-12 sm:py-16">
        <Section>
          <SectionHeader
            eyebrow="Slow travel"
            title="Eco resorts & nature stays"
            description="Solar-powered villas, forest cottages and community homestays."
            href="/properties?type=eco-resort"
          />
          <CardRail className="mt-6">
            {data.eco.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </CardRail>
        </Section>
      </section>

      <Section className="py-12 sm:py-16">
        <SectionHeader
          title="Why book with us"
          description="A marketplace built for how people actually travel in Bangladesh."
        />
        <div className="mt-8">
          <WhyUs />
        </div>
      </Section>

      <section className="bg-secondary/40 py-12 sm:py-16">
        <Section>
          <SectionHeader
            eyebrow="From real stays"
            title="What travellers say"
            description="Reviews can only be written by guests who completed a booking."
          />
          <CardRail className="mt-6">
            {data.reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </CardRail>
        </Section>
      </section>

      <Section className="py-12 sm:py-16">
        <VendorCta />
      </Section>
    </>
  );
}

function HomeSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <Section className="py-10 sm:py-12">
        <RailSkeleton count={6} className="sm:grid-cols-3 lg:grid-cols-6" height="h-24" />
      </Section>
      <Section className="pb-12 sm:pb-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </Section>
      <Section className="pb-12 sm:pb-16">
        <CardGridSkeleton count={3} />
      </Section>
    </>
  );
}
