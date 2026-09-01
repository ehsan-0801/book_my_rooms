"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { AmenityIcon } from "@/components/property/amenity-icon";
import { CATEGORIES, FILTER_AMENITIES, PROPERTY_TYPES } from "@/lib/amenities";
import { bdt } from "@/lib/format";
import { PRICE_CEILING, PRICE_FLOOR } from "@/lib/search";
import { cn } from "@/lib/utils";

interface Counts {
  type: Record<string, number>;
  category: Record<string, number>;
  amenity: Record<string, number>;
}

export function FilterPanel({
  counts,
  className,
  onApplied,
}: {
  counts: Counts;
  className?: string;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const list = useCallback(
    (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [],
    [params],
  );

  const [price, setPrice] = useState<[number, number]>(() => [
    Number(params.get("minPrice") ?? PRICE_FLOOR),
    Number(params.get("maxPrice") ?? PRICE_CEILING),
  ]);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const key of ["type", "category", "amenities", "stars"]) n += list(key).length;
    if (params.get("minPrice") || params.get("maxPrice")) n += 1;
    return n;
  }, [list, params]);

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page"); // any filter change resets pagination
      startTransition(() => {
        router.push(`/properties?${next.toString()}`, { scroll: false });
        onApplied?.();
      });
    },
    [params, router, onApplied],
  );

  const toggle = (key: string, value: string) =>
    push((p) => {
      const current = new Set(p.get(key)?.split(",").filter(Boolean) ?? []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      if (current.size) p.set(key, [...current].join(","));
      else p.delete(key);
    });

  const commitPrice = ([min, max]: [number, number]) =>
    push((p) => {
      if (min > PRICE_FLOOR) p.set("minPrice", String(min));
      else p.delete("minPrice");
      if (max < PRICE_CEILING) p.set("maxPrice", String(max));
      else p.delete("maxPrice");
    });

  const clearAll = () =>
    push((p) => {
      for (const k of ["type", "category", "amenities", "stars", "minPrice", "maxPrice", "minRating"])
        p.delete(k);
      setPrice([PRICE_FLOOR, PRICE_CEILING]);
    });

  return (
    <div className={cn("space-y-6", isPending && "opacity-70", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          Filters
          {activeCount > 0 ? (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 px-2 text-xs">
            Clear all
          </Button>
        ) : null}
      </div>

      {/* Price — SRS §9.2 */}
      <fieldset>
        <legend className="text-sm font-semibold">Price per night</legend>
        <div className="mt-4 px-1">
          <Slider
            value={price}
            min={PRICE_FLOOR}
            max={PRICE_CEILING}
            step={500}
            minStepsBetweenThumbs={1}
            onValueChange={(v) => setPrice([v[0], v[1]] as [number, number])}
            onValueCommit={(v) => commitPrice([v[0], v[1]] as [number, number])}
            aria-label="Price range per night"
          />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="rounded-md border px-2 py-1 tabular-nums">{bdt(price[0])}</span>
            <span className="text-muted-foreground">to</span>
            <span className="rounded-md border px-2 py-1 tabular-nums">
              {price[1] >= PRICE_CEILING ? `${bdt(PRICE_CEILING)}+` : bdt(price[1])}
            </span>
          </div>
        </div>
      </fieldset>

      <Separator />

      {/* Property type — SRS §9.3 */}
      <FilterGroup legend="Property type">
        {PROPERTY_TYPES.map((t) => (
          <FilterRow
            key={t.slug}
            id={`type-${t.slug}`}
            checked={list("type").includes(t.slug)}
            onCheckedChange={() => toggle("type", t.slug)}
            label={t.label}
            count={counts.type[t.slug] ?? 0}
          />
        ))}
      </FilterGroup>

      <Separator />

      {/* Category — SRS §9.4 */}
      <FilterGroup legend="Category">
        {CATEGORIES.map((c) => (
          <FilterRow
            key={c.slug}
            id={`cat-${c.slug}`}
            checked={list("category").includes(c.slug)}
            onCheckedChange={() => toggle("category", c.slug)}
            label={c.label}
            count={counts.category[c.slug] ?? 0}
          />
        ))}
      </FilterGroup>

      <Separator />

      {/* Star rating */}
      <FilterGroup legend="Star rating">
        {[5, 4, 3, 2].map((s) => (
          <FilterRow
            key={s}
            id={`star-${s}`}
            checked={list("stars").includes(String(s))}
            onCheckedChange={() => toggle("stars", String(s))}
            label={
              <span className="flex items-center gap-1">
                {Array.from({ length: s }, (_, i) => (
                  <Star key={i} className="size-3.5 fill-rating text-rating" aria-hidden />
                ))}
                <span className="sr-only">{s} star</span>
              </span>
            }
          />
        ))}
      </FilterGroup>

      <Separator />

      {/* Amenities — SRS §9.5 */}
      <FilterGroup legend="Amenities">
        {FILTER_AMENITIES.map((a) => (
          <FilterRow
            key={a.slug}
            id={`am-${a.slug}`}
            checked={list("amenities").includes(a.slug)}
            onCheckedChange={() => toggle("amenities", a.slug)}
            label={
              <span className="flex items-center gap-2">
                <AmenityIcon slug={a.slug} className="size-4 text-muted-foreground" />
                {a.name}
              </span>
            }
            count={counts.amenity[a.slug] ?? 0}
          />
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  legend,
  children,
}: {
  legend: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-3 space-y-0.5">{children}</div>
    </fieldset>
  );
}

function FilterRow({
  id,
  checked,
  onCheckedChange,
  label,
  count,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: () => void;
  label: React.ReactNode;
  count?: number;
}) {
  const empty = count === 0;
  return (
    <div className="flex items-center gap-3 rounded-md py-1.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={empty && !checked} />
      <Label
        htmlFor={id}
        className={cn(
          "flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal",
          empty && !checked && "text-muted-foreground/50",
        )}
      >
        {label}
        {count !== undefined ? (
          <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
        ) : null}
      </Label>
    </div>
  );
}
