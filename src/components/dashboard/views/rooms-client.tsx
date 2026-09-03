"use client";

import Image from "next/image";
import Link from "next/link";
import { BedDouble, CalendarRange, Pencil, Plus, Users } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applyDiscount, bdt } from "@/lib/format";
import { deleteRoom } from "@/lib/actions/room";


type Row = RoomRow;
import { PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function RoomsClient() {
  const { data, loading } = useApi<ViewData>("/api/dashboard/rooms");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={7} columns={6} />
      </div>
    );
  }

  return <RoomsView data={data} />;
}

/** Inferred from the resource loader, so the view cannot drift from the query. */
type ViewData = ResourceData<"rooms">;
type RoomRow = ViewData[number];

function RoomsView({ data: rooms }: { data: ViewData }) {

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Room",
      mobile: "title",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {r.images[0] ? (
              <Image src={r.images[0].url} alt="" fill sizes="40px" className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <span className="block max-w-48 truncate font-medium">{r.name}</span>
            <span className="block max-w-48 truncate text-xs text-muted-foreground">
              {r.property.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "occupancy",
      header: "Occupancy",
      mobile: "body",
      cell: (r) => (
        <span className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <Users className="size-3.5 text-muted-foreground" aria-hidden />
          {r.maxGuests}
          <BedDouble className="ml-1.5 size-3.5 text-muted-foreground" aria-hidden />
          {r.bedType ?? "—"}
        </span>
      ),
    },
    {
      key: "units",
      header: "Inventory",
      mobile: "body",
      cell: (r) => <span className="tabular-nums">{r.totalUnits}</span>,
    },
    {
      key: "bookings",
      header: "Booked",
      mobile: "body",
      cell: (r) => <span className="tabular-nums">{r._count.bookingItems}</span>,
    },
    {
      key: "price",
      header: "Rate / night",
      align: "right",
      mobile: "body",
      cell: (r) => {
        const pct = Number(r.discountValue ?? 0);
        const final = applyDiscount(Number(r.basePrice), pct || undefined);
        return (
          <span className="whitespace-nowrap">
            {pct ? (
              <span className="mr-1.5 text-xs text-muted-foreground line-through">
                {bdt(Number(r.basePrice))}
              </span>
            ) : null}
            <span className="font-medium tabular-nums">{bdt(final)}</span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          <Badge className={r.isActive ? "bg-success text-white" : "bg-muted text-muted-foreground"}>
            {r.isActive ? "Bookable" : "Hidden"}
          </Badge>
          {r.breakfastIncluded ? <Badge variant="secondary">Breakfast</Badge> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (r) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/rooms/${r.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            aria-label={`Availability calendar for ${r.name}`}
          >
            <Link href={`/dashboard/availability?room=${r.id}`}>
              <CalendarRange className="size-4" aria-hidden />
              <span className="md:sr-only">Calendar</span>
            </Link>
          </Button>
          <DeleteDialog
            action={deleteRoom}
            id={r.id}
            title={`Delete ${r.name}`}
            description="This removes the room, its images and its availability calendar. Rooms with active bookings can't be deleted."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms & rates"
        description="Room types, inventory and nightly pricing across your properties."
        action={
          <Button asChild>
            <Link href="/dashboard/rooms/new">
              <Plus aria-hidden />
              Add room
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rooms}
        rowKey={(r) => r.id}
        caption="Rooms"
        empty={
          <EmptyState
            icon="BedDouble"
            title="No rooms yet"
            body="Add a room type so travellers have something to book."
            action={
              <Button asChild>
                <Link href="/dashboard/rooms/new">Add room</Link>
              </Button>
            }
          />
        }
      />
    </div>
  );
}

