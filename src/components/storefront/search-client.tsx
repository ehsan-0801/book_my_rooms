"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, SearchX } from "lucide-react";

import { PropertyCard } from "@/components/property/property-card";
import { FilterPanel } from "@/components/search/filter-panel";
import { MobileFilterButton } from "@/components/search/mobile-filter-button";
import { SearchBar } from "@/components/search/search-bar";
import { SortSelect } from "@/components/search/sort-select";
import { RowListSkeleton } from "@/components/storefront/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { countActiveFilters, parseSearchQuery } from "@/lib/search";
import { useApi } from "@/lib/api/client";
import type { AmenityRef, Destination, Property } from "@/lib/types";

interface SearchData {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
  counts: {
    type: Record<string, number>;
    category: Record<string, number>;
    amenity: Record<string, number>;
  };
  types: { slug: string; name: string; icon: string | null }[];
  amenities: AmenityRef[];
  destinations: Destination[];
  destination: Destination | null;
}

const EMPTY_COUNTS = { type: {}, category: {}, amenity: {} };

export function SearchClient() {
  const params = useSearchParams();
  const query = parseSearchQuery(Object.fromEntries(params.entries()));
  const activeCount = countActiveFilters(query);

  // Re-fetches whenever any filter changes, because the URL is the query.
  const { data, loading } = useApi<SearchData>(
    `/api/storefront/properties?${params.toString()}`,
  );

  const heading = data?.destination
    ? `Stays in ${data.destination.name}`
    : "Stays across Bangladesh";

  return (
    <>
      <div className="border-b bg-secondary/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {data ? (
            <SearchBar
              destinations={data.destinations}
              variant="inline"
              defaultDestination={query.destination ?? ""}
            />
          ) : (
            <Skeleton className="h-28 w-full rounded-2xl" />
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-6">
              {data ? (
                <FilterPanel
                  counts={data.counts}
                  types={data.types}
                  amenities={data.amenities}
                />
              ) : (
                <div className="space-y-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {heading}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading || !data ? (
                    <span className="inline-block align-middle">
                      <Skeleton className="h-4 w-40" />
                    </span>
                  ) : (
                    <>
                      {data.total} propert{data.total === 1 ? "y" : "ies"} found
                      {data.destination ? (
                        <>
                          {" "}
                          <span aria-hidden>·</span>{" "}
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" aria-hidden />
                            {data.destination.division} Division
                          </span>
                        </>
                      ) : null}
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <MobileFilterButton
                  counts={data?.counts ?? EMPTY_COUNTS}
                  types={data?.types ?? []}
                  amenities={data?.amenities ?? []}
                  activeCount={activeCount}
                />
                <SortSelect />
              </div>
            </div>

            {loading || !data ? (
              <div className="mt-6">
                <RowListSkeleton count={4} />
              </div>
            ) : data.properties.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <div className="mt-6 grid gap-4">
                  {data.properties.map((p, i) => (
                    <PropertyCard key={p.id} property={p} layout="row" priority={i < 2} />
                  ))}
                </div>
                {data.totalPages > 1 ? (
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    params={params}
                  />
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
  params,
}: {
  page: number;
  totalPages: number;
  params: URLSearchParams;
}) {
  const hrefFor = (n: number) => {
    const next = new URLSearchParams(params.toString());
    if (n > 1) next.set("page", String(n));
    else next.delete("page");
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
            <Button asChild variant={n === page ? "default" : "ghost"} size="icon" className="size-9">
              <Link href={hrefFor(n)} aria-current={n === page ? "page" : undefined}>
                {n}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
      <Button asChild={page < totalPages} variant="outline" size="sm" disabled={page >= totalPages}>
        {page < totalPages ? <Link href={hrefFor(page + 1)}>Next</Link> : <span>Next</span>}
      </Button>
    </nav>
  );
}
