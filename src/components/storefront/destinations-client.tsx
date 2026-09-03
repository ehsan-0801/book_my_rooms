"use client";

import { DestinationCard } from "@/components/home/destination-card";
import { SearchBar } from "@/components/search/search-bar";
import { Section, SectionHeader } from "@/components/site/section";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api/client";
import type { Destination } from "@/lib/types";

export function DestinationsClient() {
  const { data, loading } = useApi<Destination[]>("/api/storefront/destinations");

  const total = data?.reduce((n, d) => n + d.propertyCount, 0) ?? 0;

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
          {data ? (
            <SearchBar destinations={data} variant="inline" className="mt-6" />
          ) : (
            <Skeleton className="mt-6 h-28 w-full rounded-2xl" />
          )}
        </Section>
      </div>

      <Section className="py-10 sm:py-14">
        <SectionHeader
          title="All destinations"
          description={
            loading
              ? "Loading the catalogue…"
              : `${total.toLocaleString("en-BD")} properties listed across Bangladesh.`
          }
        />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {loading || !data
            ? Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))
            : data.map((d) => <DestinationCard key={d.slug} destination={d} />)}
        </div>
      </Section>
    </>
  );
}
