"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarDays, MapPin, Minus, Plus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export interface DestinationOption {
  slug: string;
  name: string;
  division: string;
}

export interface SearchBarProps {
  /** Destinations come from the database, so the server passes them in. */
  destinations: DestinationOption[];
  /** "hero" floats on photography; "inline" sits on a page background. */
  variant?: "hero" | "inline";
  defaultDestination?: string;
  className?: string;
}

export function SearchBar({
  destinations,
  variant = "hero",
  defaultDestination = "",
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [destination, setDestination] = useState(defaultDestination);
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: addDays(today(), 7),
    to: addDays(today(), 9),
  }));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const stayLabel = useMemo(() => {
    if (!range?.from) return "Add dates";
    if (!range.to) return `${formatDate(range.from)} — add checkout`;
    return `${formatDate(range.from)} – ${formatDate(range.to)}`;
  }, [range]);

  const guestLabel = `${adults + children} guest${adults + children === 1 ? "" : "s"}, ${rooms} room${rooms === 1 ? "" : "s"}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (range?.from) params.set("checkIn", range.from.toISOString().slice(0, 10));
    if (range?.to) params.set("checkOut", range.to.toISOString().slice(0, 10));
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("rooms", String(rooms));
    router.push(`/properties?${params.toString()}`);
  }

  const onHero = variant === "hero";

  return (
    <form
      onSubmit={submit}
      className={cn(
        "w-full rounded-2xl border p-2 shadow-lg",
        onHero
          ? "border-white/40 bg-background shadow-2xl shadow-black/25 backdrop-blur-md supports-[backdrop-filter]:bg-background/96"
          : "border-border bg-card shadow-sm",
        className,
      )}
    >
      {/*
        Mobile: stacked full-width controls.
        Tablet: a 2×2 grid, so the bar doesn't strand horizontal space.
        Desktop: one horizontal pill with hairline dividers.
      */}
      <div className="flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3 lg:flex lg:flex-row lg:items-stretch lg:gap-0">
        {/* Destination */}
        <div className="flex-1 lg:pr-1">
          <Label
            htmlFor="destination"
            className="px-3 pt-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Where to
          </Label>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger
              id="destination"
              className="h-11 w-full border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 data-[size=default]:h-11 dark:bg-transparent dark:hover:bg-transparent"
            >
              <span className="flex min-w-0 items-center gap-2">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                <SelectValue placeholder="Any destination in Bangladesh" />
              </span>
            </SelectTrigger>
            <SelectContent>
              {destinations.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>
                  {d.name}
                  <span className="ml-1 text-muted-foreground">· {d.division}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Dates */}
        <div className="flex-1 lg:px-1">
          <span className="block px-3 pt-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Check-in — Check-out
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start gap-2 px-3 font-normal hover:bg-transparent"
              >
                <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
                <span className={cn("truncate", !range?.from && "text-muted-foreground")}>
                  {stayLabel}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                numberOfMonths={1}
                defaultMonth={range?.from}
                selected={range}
                onSelect={setRange}
                disabled={{ before: today() }}
                className="sm:[--cell-size:--spacing(9)]"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="hidden lg:block" />

        {/* Guests & rooms */}
        <div className="flex-1 lg:px-1">
          <span className="block px-3 pt-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Guests &amp; rooms
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start gap-2 px-3 font-normal hover:bg-transparent"
              >
                <Users className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{guestLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="grid gap-1">
                <Stepper label="Adults" hint="Age 13+" value={adults} min={1} max={20} onChange={setAdults} />
                <Stepper label="Children" hint="Age 0–12" value={children} min={0} max={10} onChange={setChildren} />
                <Separator className="my-2" />
                <Stepper label="Rooms" value={rooms} min={1} max={10} onChange={setRooms} />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Submit */}
        <div className="flex items-end md:pb-0.5 lg:pl-2">
          <Button type="submit" size="lg" className="h-12 w-full gap-2 lg:w-auto lg:px-7">
            <Search className="size-4" aria-hidden />
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const id = `stepper-${label.toLowerCase()}`;
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <div>
        <span id={id} className="text-sm font-medium">
          {label}
        </span>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="size-3.5" aria-hidden />
        </Button>
        <output
          aria-labelledby={id}
          className="w-7 text-center text-sm font-semibold tabular-nums"
        >
          {value}
        </output>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
