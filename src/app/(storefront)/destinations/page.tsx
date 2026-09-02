import type { Metadata } from "next";

import { DestinationCard } from "@/components/home/destination-card";
import { SearchBar } from "@/components/search/search-bar";
import { Section, SectionHeader } from "@/components/site/section";
import { listDestinations } from "@/lib/queries/storefront";

export const metadata: Metadata = {
  title: "Destinations in Bangladesh",
  description:
    "Explore Cox's Bazar, Sylhet, Bandarban, the Sundarbans, Sreemangal, Saint Martin's Island, Rangamati and Kuakata.",
};

export const revalidate = 600;

export default async function DestinationsPage() {
  const destinations = await listDestinations();
  return (
    <>
      <div className="border-b bg-secondary/40">
        <Section className="py-10 sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Where do you want to go?
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Eight destinations, from the world&rsquo;s longest sea beach to
            cloud-level ridges in the Hill Tracts.
          </p>
          <SearchBar destinations={destinations} variant="inline" className="mt-6" />
        </Section>
      </div>

      <Section className="py-10 sm:py-14">
        <SectionHeader
          title="All destinations"
          description={`${destinations.reduce((n, d) => n + d.propertyCount, 0).toLocaleString("en-BD")} properties listed across Bangladesh.`}
        />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {destinations.map((d) => (
            <DestinationCard key={d.slug} destination={d} />
          ))}
        </div>
      </Section>
    </>
  );
}
