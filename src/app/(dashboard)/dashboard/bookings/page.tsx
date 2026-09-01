import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { setBookingStatus } from "@/lib/actions/vendor";
import { requestCancellation } from "@/lib/actions/customer";
import type { BookingStatus, Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Bookings", robots: { index: false } };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

type Row = Awaited<ReturnType<typeof load>>[number];
async function load(where: Prisma.BookingWhereInput) {
  return prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true, reference: true, guestName: true, guestPhone: true,
      checkIn: true, checkOut: true, nights: true, grandTotal: true,
      status: true, paymentStatus: true,
      property: { select: { name: true } },
      items: { select: { roomName: true, units: true } },
    },
  });
}

export default async function BookingsPage({
  searchParams,
}: PageProps<"/dashboard/bookings">) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? "all";
  const isCustomer = user.role === "CUSTOMER";

  // Scope by role — a vendor sees only their properties, a customer only theirs.
  const scope: Prisma.BookingWhereInput =
    user.role === "ADMIN"
      ? {}
      : user.role === "VENDOR"
        ? { property: { vendorId: user.vendorId ?? "__none__" } }
        : { userId: user.id };

  const bookings = await load({
    ...scope,
    ...(status !== "all" ? { status: status as BookingStatus } : {}),
  });

  const columns: Column<Row>[] = [
    {
      key: "reference",
      header: "Reference",
      mobile: "title",
      cell: (b) => (
        <Link
          href={`/dashboard/bookings/${b.id}`}
          className="font-mono text-xs font-semibold hover:underline"
        >
          {b.reference}
        </Link>
      ),
    },
    ...(!isCustomer
      ? [
          {
            key: "guest",
            header: "Guest",
            mobile: "body" as const,
            cell: (b: Row) => (
              <span className="whitespace-nowrap">
                <span className="block font-medium">{b.guestName}</span>
                <span className="block text-xs text-muted-foreground">{b.guestPhone}</span>
              </span>
            ),
          },
        ]
      : []),
    {
      key: "property",
      header: "Property & room",
      mobile: "body",
      cell: (b) => (
        <span className="block max-w-56">
          <span className="block truncate font-medium">{b.property.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {b.items.map((i) => `${i.units}× ${i.roomName}`).join(", ")}
          </span>
        </span>
      ),
    },
    {
      key: "stay",
      header: "Stay",
      mobile: "body",
      cell: (b) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(b.checkIn)}
          <br />→ {formatDateLong(b.checkOut)} ({b.nights}n)
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: "payment",
      header: "Payment",
      mobile: "meta",
      cell: (b) => <StatusBadge status={b.paymentStatus} />,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      mobile: "body",
      cell: (b) => (
        <span className="font-medium tabular-nums whitespace-nowrap">
          {bdt(Number(b.grandTotal))}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (b) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/bookings/${b.id}`}>
              <Eye className="size-3.5" aria-hidden />
              View
            </Link>
          </Button>

          {isCustomer ? (
            ["PENDING", "PAYMENT_PENDING", "CONFIRMED"].includes(b.status) ? (
              <form action={requestCancellation}>
                <input type="hidden" name="id" value={b.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                >
                  Cancel
                </Button>
              </form>
            ) : null
          ) : (
            <>
              {["PENDING", "PAYMENT_PENDING"].includes(b.status) ? (
                <form action={setBookingStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="CONFIRMED" />
                  <Button type="submit" size="sm">Confirm</Button>
                </form>
              ) : null}
              {b.status === "CONFIRMED" ? (
                <form action={setBookingStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="COMPLETED" />
                  <Button type="submit" size="sm" variant="outline">Check out</Button>
                </form>
              ) : null}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? "My bookings" : "Bookings"}
        description={
          isCustomer
            ? "Every stay you've booked, with invoices and cancellation options."
            : user.role === "VENDOR"
              ? "Reservations across all your properties."
              : "Every booking on the marketplace."
        }
      />

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            asChild
            size="sm"
            className="shrink-0"
            variant={status === f.value ? "default" : "outline"}
          >
            <Link
              href={
                f.value === "all"
                  ? "/dashboard/bookings"
                  : `/dashboard/bookings?status=${f.value}`
              }
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={bookings}
        rowKey={(b) => b.id}
        caption="Bookings"
        empty={
          <EmptyState
            icon="CalendarX"
            title="No bookings here"
            body={
              isCustomer
                ? "When you book a stay it'll appear here."
                : "No bookings match this filter yet."
            }
            action={
              isCustomer ? (
                <Button asChild>
                  <Link href="/properties">Find a stay</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />
    </div>
  );
}
