import { TicketPercent } from "lucide-react";

import { Hero } from "@/components/home/hero";
import { PropertyTypeStrip } from "@/components/home/property-type-strip";
import { DestinationCard } from "@/components/home/destination-card";
import { ReviewCard } from "@/components/home/review-card";
import { VendorCta } from "@/components/home/vendor-cta";
import { WhyUs } from "@/components/home/why-us";
import { PropertyCard } from "@/components/property/property-card";
import { CardRail, Section, SectionHeader } from "@/components/site/section";
import { DESTINATIONS } from "@/lib/destinations";
import {
  budgetProperties,
  discountedProperties,
  ecoProperties,
  featuredProperties,
  topReviews,
} from "@/lib/properties";

export default function HomePage() {
  const featured = featuredProperties().slice(0, 6);
  const offers = discountedProperties().slice(0, 3);
  const budget = budgetProperties().slice(0, 3);
  const eco = ecoProperties()
    .filter((p) => p.type === "eco-resort" || p.type === "cottage" || p.type === "homestay")
    .slice(0, 3);
  const reviews = topReviews().slice(0, 3);

  return (
    <>
      <Hero />

      {/* Property types */}
      <Section className="py-10 sm:py-12">
        <PropertyTypeStrip />
      </Section>

      {/* Popular destinations — SRS §6.4 */}
      <Section className="pb-12 sm:pb-16">
        <SectionHeader
          eyebrow="Where to next"
          title="Popular destinations"
          description="From the world's longest sea beach to tea gardens and cloud-level ridges."
          href="/destinations"
        />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {DESTINATIONS.slice(0, 8).map((d) => (
            <DestinationCard key={d.slug} destination={d} />
          ))}
        </div>
      </Section>

      {/* Featured properties — SRS §6.5 */}
      <Section className="pb-12 sm:pb-16">
        <SectionHeader
          eyebrow="Handpicked"
          title="Featured properties"
          description="Reviewed by our team and consistently rated highly by guests."
          href="/properties?sort=featured"
        />
        <CardRail className="mt-6">
          {featured.map((p, i) => (
            <PropertyCard key={p.id} property={p} priority={i < 3} />
          ))}
        </CardRail>
      </Section>

      {/* Special offers — SRS §6.6 */}
      <section className="bg-secondary/40 py-12 sm:py-16">
        <Section>
          <SectionHeader
            eyebrow={
              <>
                <TicketPercent className="mr-1 inline size-3.5" aria-hidden /> Limited time
              </>
            }
            title="Special offers"
            description="Seasonal and vendor discounts, applied automatically at checkout."
            href="/offers"
          />
          <CardRail className="mt-6">
            {offers.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </CardRail>
        </Section>
      </section>

      {/* Budget hotels — SRS §6.2 */}
      <Section className="py-12 sm:py-16">
        <SectionHeader
          eyebrow="Under ৳5,500 a night"
          title="Budget stays that don't feel like it"
          description="Clean, well-reviewed rooms at prices that hold through peak season."
          href="/properties?category=budget"
        />
        <CardRail className="mt-6">
          {budget.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </CardRail>
      </Section>

      {/* Eco resorts — SRS §6.3 */}
      <section className="border-y bg-card py-12 sm:py-16">
        <Section>
          <SectionHeader
            eyebrow="Slow travel"
            title="Eco resorts & nature stays"
            description="Solar-powered villas, forest cottages and community homestays."
            href="/properties?type=eco-resort"
          />
          <CardRail className="mt-6">
            {eco.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </CardRail>
        </Section>
      </section>

      {/* Why us */}
      <Section className="py-12 sm:py-16">
        <SectionHeader
          title="Why book with us"
          description="A marketplace built for how people actually travel in Bangladesh."
        />
        <div className="mt-8">
          <WhyUs />
        </div>
      </Section>

      {/* Reviews — SRS §6.7 */}
      <section className="bg-secondary/40 py-12 sm:py-16">
        <Section>
          <SectionHeader
            eyebrow="From real stays"
            title="What travellers say"
            description="Reviews can only be written by guests who completed a booking."
          />
          <CardRail className="mt-6">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </CardRail>
        </Section>
      </section>

      {/* Vendor CTA */}
      <Section className="py-12 sm:py-16">
        <VendorCta />
      </Section>
    </>
  );
}
