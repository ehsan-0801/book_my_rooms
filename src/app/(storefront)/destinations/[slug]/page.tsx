import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";

import { PropertyCard } from "@/components/property/property-card";
import { SearchBar } from "@/components/search/search-bar";
import { Section } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DESTINATIONS, getDestination } from "@/lib/destinations";
import { bdt } from "@/lib/format";
import { propertiesIn } from "@/lib/properties";

export function generateStaticParams() {
  return DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestination(slug);
  if (!d) return { title: "Destination not found" };
  return {
    title: `Hotels & resorts in ${d.name}`,
    description: `${d.tagline}. Compare ${d.propertyCount} properties in ${d.name}, ${d.division} from ${bdt(d.fromPrice)} a night.`,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: { images: [{ url: d.image }] },
  };
}

export default async function DestinationPage({
  params,
}: PageProps<"/destinations/[slug]">) {
  const { slug } = await params;
  const destination = getDestination(slug);
  if (!destination) notFound();

  const properties = propertiesIn(destination.slug);

  return (
    <>
      {/* Destination hero */}
      <section className="relative isolate">
        <Image
          src={destination.image}
          alt={`${destination.name}, ${destination.division}`}
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/45 to-black/30"
        />

        <Section className="py-12 sm:py-16 lg:py-20">
          <Breadcrumb>
            <BreadcrumbList className="text-white/70">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="text-white/70 hover:text-white">
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/destinations" className="text-white/70 hover:text-white">
                    Destinations
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">{destination.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <h1 className="text-shadow-hero mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {destination.name}
          </h1>
          <p className="text-shadow-hero mt-2 max-w-xl text-white/90 sm:text-lg">
            {destination.tagline}
          </p>
          <p className="text-shadow-hero mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {destination.division} Division
            </span>
            <span aria-hidden>·</span>
            <span>{destination.propertyCount} properties</span>
            <span aria-hidden>·</span>
            <span>from {bdt(destination.fromPrice)} a night</span>
          </p>

          <SearchBar
            className="mt-8"
            defaultDestination={destination.slug}
          />
        </Section>
      </section>

      {/* Listings */}
      <Section className="py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Stays in {destination.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {properties.length} propert{properties.length === 1 ? "y" : "ies"} available
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/properties?destination=${destination.slug}`}>
              Search with filters
            </Link>
          </Button>
        </div>

        {properties.length ? (
          <div className="mt-6 grid gap-4">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={p} layout="row" priority={i < 2} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No properties listed here yet. We&rsquo;re onboarding vendors in{" "}
            {destination.name} now.
          </p>
        )}

        {/* CC BY-SA requires the credit to travel with the image */}
        <p className="mt-8 text-xs text-muted-foreground">
          Photo of {destination.name} by {destination.credit.author}, licensed{" "}
          {destination.credit.license} via{" "}
          <a
            href={destination.credit.source}
            target="_blank"
            rel="noreferrer noopener"
            className="underline hover:text-foreground"
          >
            Wikimedia Commons
          </a>
          .
        </p>
      </Section>
    </>
  );
}
