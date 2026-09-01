import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { requireRole } from "@/lib/auth-guards";
import { bdt } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { bulkCloseDates, setDateAvailability } from "@/lib/actions/vendor";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Availability", robots: { index: false } };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AvailabilityPage({
  searchParams,
}: PageProps<"/dashboard/availability">) {
  const user = await requireRole("ADMIN", "VENDOR");
  const sp = await searchParams;
  const roomParam = Array.isArray(sp.room) ? sp.room[0] : sp.room;

  const scope =
    user.role === "ADMIN" ? {} : { property: { vendorId: user.vendorId ?? "__none__" } };

  const rooms = await prisma.room.findMany({
    where: scope,
    orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true, name: true, totalUnits: true, basePrice: true,
      property: { select: { name: true } },
    },
  });

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon="CalendarRange"
        title="No rooms to manage"
        body="Add a room type and its availability calendar appears here."
        action={
          <Button asChild>
            <Link href="/dashboard/rooms/new">Add room</Link>
          </Button>
        }
      />
    );
  }

  const selected = rooms.find((r) => r.id === roomParam) ?? rooms[0];

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + 60);

  const availability = await prisma.roomAvailability.findMany({
    where: { roomId: selected.id, date: { gte: today, lt: horizon } },
    orderBy: { date: "asc" },
  });

  const byDate = new Map(
    availability.map((a) => [a.date.toISOString().slice(0, 10), a]),
  );

  // 60 nights from today, padded so the grid starts on the right weekday.
  const days = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
  const leadingBlanks = days[0].getUTCDay();

  const toInput = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Availability"
        description="Open, close and re-price individual nights for the next 60 days."
      />

      {/* Room picker */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {rooms.map((r) => (
          <Button
            key={r.id}
            asChild
            size="sm"
            className="shrink-0"
            variant={r.id === selected.id ? "default" : "outline"}
          >
            <Link href={`/dashboard/availability?room=${r.id}`}>
              {r.name}
              <span className="ml-1 opacity-70">· {r.property.name}</span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Bulk range */}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold">Close or reopen a range</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Useful for maintenance windows or when a property is fully booked offline.
        </p>
        <ActionForm
          action={bulkCloseDates}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
        >
          <input type="hidden" name="roomId" value={selected.id} />
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" required defaultValue={toInput(today)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" required defaultValue={toInput(days[6])} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="close">Action</Label>
            <select
              id="close"
              name="close"
              className="mt-1.5 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="true">Close (stop sell)</option>
              <option value="false">Reopen</option>
            </select>
          </div>
          <SubmitButton>Apply to range</SubmitButton>
        </ActionForm>
      </section>

      {/* Calendar */}
      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {selected.name}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {selected.totalUnits} rooms · {bdt(Number(selected.basePrice))} base
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-success/25 ring-1 ring-success/40" /> Open
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-warning/25 ring-1 ring-warning/40" /> Low
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded bg-destructive/20 ring-1 ring-destructive/40" /> Closed / full
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center sm:gap-2">
          {DAY_LABELS.map((d) => (
            <div key={d} className="pb-1 text-[11px] font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`blank-${i}`} aria-hidden />
          ))}

          {days.map((day) => {
            const key = toInput(day);
            const row = byDate.get(key);
            const units = row?.unitsOpen ?? selected.totalUnits;
            const closed = row?.isClosed || units === 0;
            const low = !closed && units <= Math.max(1, Math.floor(selected.totalUnits * 0.3));

            return (
              <details
                key={key}
                className={cn(
                  "group rounded-lg border p-1.5 text-left transition-colors sm:p-2",
                  closed
                    ? "border-destructive/40 bg-destructive/10"
                    : low
                      ? "border-warning/40 bg-warning/10"
                      : "border-success/30 bg-success/10",
                )}
              >
                <summary className="cursor-pointer list-none">
                  <span className="block text-xs font-semibold tabular-nums">
                    {day.getUTCDate()}
                  </span>
                  <span className="block text-[10px] text-muted-foreground tabular-nums">
                    {closed ? "closed" : `${units} left`}
                  </span>
                  {row?.price ? (
                    <span className="block text-[10px] font-medium text-price tabular-nums">
                      {bdt(Number(row.price), { compact: true })}
                    </span>
                  ) : null}
                </summary>

                {/* Native <details> keeps this a server component — no JS needed
                    to edit a single night. */}
                <ActionForm action={setDateAvailability} className="mt-2 space-y-1.5">
                  <input type="hidden" name="roomId" value={selected.id} />
                  <input type="hidden" name="date" value={key} />
                  <label className="block text-[10px] font-medium">
                    Units
                    <Input
                      name="unitsOpen"
                      type="number"
                      min={0}
                      max={selected.totalUnits}
                      defaultValue={units}
                      className="mt-0.5 h-7 text-xs"
                    />
                  </label>
                  <label className="block text-[10px] font-medium">
                    Price
                    <Input
                      name="price"
                      type="number"
                      min={0}
                      placeholder={String(Number(selected.basePrice))}
                      defaultValue={row?.price ? Number(row.price) : ""}
                      className="mt-0.5 h-7 text-xs"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px]">
                    <input
                      type="checkbox"
                      name="isClosed"
                      value="true"
                      defaultChecked={row?.isClosed ?? false}
                      className="size-3 accent-primary"
                    />
                    Closed
                  </label>
                  <SubmitButton size="sm" className="h-7 w-full text-[10px]">
                    Save
                  </SubmitButton>
                </ActionForm>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
