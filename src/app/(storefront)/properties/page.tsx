import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MapPin, SearchX } from "lucide-react";

import { PropertyCard } from "@/components/property/property-card";
import { FilterPanel } from "@/components/search/filter-panel";
import { MobileFilterButton } from "@/components/search/mobile-filter-button";
import { SearchBar } from "@/components/search/search-bar";
import { SortSelect } from "@/components/search/sort-select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { countActiveFilters, parseSearchQuery } from "@/lib/search";
import { getFacetCounts, searchProperties } from "@/lib/queries/search";
import {
  getDestination,
  listDestinations,
  listFilterAmenities,
  listPropertyTypes,
} from "@/lib/queries/storefront";

export const metadata: Metadata = {
  title: "Search stays",
  description:
    "Search hotels, resorts, cottages, villas, homestays and eco-resorts across Bangladesh with live availability.",
};

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const sp = await searchParams;
  const query = parseSearchQuery(sp);

  // Results, facet counts and the filter vocabulary all come from the database
  // in one round of parallel queries.
  const [destination, { properties: results, total, page, totalPages }, counts, types, amenities] =
    await Promise.all([
      query.destination ? getDestination(query.destination) : Promise.resolve(null),
      searchProperties(query),
      getFacetCounts(query),
      listPropertyTypes(),
      listFilterAmenities(),
    ]);
  const destinations = await listDestinations();

  const activeCount = countActiveFilters(query);

  const heading = destination
    ? `Stays in ${destination.name}`
    : "Stays across Bangladesh";

  return (
    <>
      {/* Search summary bar */}
      <div className="border-b bg-secondary/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Suspense fallback={<Skeleton className="h-28 w-full rounded-2xl" />}>
            <SearchBar
              destinations={destinations}
              variant="inline"
              defaultDestination={query.destination ?? ""}
            />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8">
          {/* Desktop filter rail */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-6">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <FilterPanel counts={counts} types={types} amenities={amenities} />
              </Suspense>
            </div>
          </aside>

          <div className="min-w-0">
            {/* Result header */}
            <div className="flex flex-col gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {total} propert{total === 1 ? "y" : "ies"} found
                  {destination ? (
                    <>
                      {" "}
                      <span aria-hidden>·</span>{" "}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {destination.division} Division
                      </span>
                    </>
                  ) : null}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Suspense fallback={<Skeleton className="h-9 w-28" />}>
                  <MobileFilterButton counts={counts} types={types} amenities={amenities} activeCount={activeCount} />
                </Suspense>
                <Suspense fallback={<Skeleton className="h-9 w-56" />}>
                  <SortSelect />
                </Suspense>
              </div>
            </div>

            {/* Results */}
            {results.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="mt-6 grid gap-4">
                  {results.map((p, i) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      layout="row"
                      priority={i < 2}
                    />
                  ))}
                </div>

                {totalPages > 1 ? (
                  <Pagination page={page} totalPages={totalPages} sp={sp} />
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <SearchX className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold">No properties match those filters</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Try widening the price range, or removing an amenity or two. Most
        properties in the hills don&rsquo;t have pools, for example.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link href="/properties">Clear all filters</Link>
      </Button>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  sp,
}: {
  page: number;
  totalPages: number;
  sp: Record<string, string | string[] | undefined>;
}) {
  const hrefFor = (n: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (v === undefined || k === "page") continue;
      next.set(k, Array.isArray(v) ? v.join(",") : v);
    }
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/properties?${qs}` : "/properties";
  };

  return (
    <nav
      aria-label="Search results pages"
      className="mt-8 flex items-center justify-center gap-2"
    >
      <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1}>
        {page > 1 ? <Link href={hrefFor(page - 1)}>Previous</Link> : <span>Previous</span>}
      </Button>

      <ul className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Button
              asChild
              variant={n === page ? "default" : "ghost"}
              size="icon"
              className="size-9"
            >
              <Link href={hrefFor(n)} aria-current={n === page ? "page" : undefined}>
                {n}
              </Link>
            </Button>
          </li>
        ))}
      </ul>

      <Button asChild={page < totalPages} variant="outline" size="sm" disabled={page >= totalPages}>
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)}>Next</Link>
        ) : (
          <span>Next</span>
        )}
      </Button>
    </nav>
  );
}
