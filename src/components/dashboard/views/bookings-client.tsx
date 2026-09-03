"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { bdt, formatDateLong } from "@/lib/format";
import { setBookingStatus } from "@/lib/actions/vendor";
import { requestCancellation } from "@/lib/actions/customer";


const FILTERS = [
  { value: "all", label: "All" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

type ViewData = ResourceData<"bookings">;
type Row = ViewData["bookings"][number];
import { useSearchParams } from "next/navigation";
import { FiltersSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function BookingsClient() {
  // The URL is the query: any filter change refetches.
  const params = useSearchParams();
  const { data, loading } = useApi<ViewData>(
    `/api/dashboard/bookings?${params.toString()}`,
  );

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <FiltersSkeleton count={5} />
        <TableSkeleton rows={7} columns={7} />
      </div>
    );
  }

  return <BookingsView data={data} params={params} />;
}

function BookingsView({
  data,
  params,
}: {
  data: ViewData;
  params: URLSearchParams;
}) {
  const bookings = data.bookings;
  const user = { role: data.role };
  const isCustomer = data.role === "CUSTOMER";
  const status = params.get("status") ?? "all";

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
              <ActionForm action={requestCancellation}>
                <input type="hidden" name="id" value={b.id} />
                <SubmitButton
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                >
                  Cancel
                </SubmitButton>
              </ActionForm>
            ) : null
          ) : (
            <>
              {["PENDING", "PAYMENT_PENDING"].includes(b.status) ? (
                <ActionForm action={setBookingStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="CONFIRMED" />
                  <SubmitButton size="sm">Confirm</SubmitButton>
                </ActionForm>
              ) : null}
              {b.status === "CONFIRMED" ? (
                <ActionForm action={setBookingStatus}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="COMPLETED" />
                  <SubmitButton size="sm" variant="outline">Check out</SubmitButton>
                </ActionForm>
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

