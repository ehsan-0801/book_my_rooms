"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { bdt, formatDateLong } from "@/lib/format";
import { setCustomerActive } from "@/lib/actions/admin";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"customers/detail">;

export function CustomerDetailClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/customers/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <CustomerDetailView data={data} />;
}

function CustomerDetailView({ data }: { data: ViewData }) {
  const customer = data.customer;
  const spend = { _sum: { grandTotal: data.totalSpend } };
  type BookingRow = ViewData["customer"]["bookings"][number];

const columns: Column<BookingRow>[] = [
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
    {
      key: "property",
      header: "Property",
      mobile: "body",
      cell: (b) => <span className="block max-w-52 truncate">{b.property.name}</span>,
    },
    {
      key: "stay",
      header: "Stay",
      mobile: "body",
      cell: (b) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(b.checkIn)} → {formatDateLong(b.checkOut)}
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
      key: "total",
      header: "Total",
      align: "right",
      mobile: "body",
      cell: (b) => (
        <span className="font-medium tabular-nums">{bdt(Number(b.grandTotal))}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/dashboard/customers">
          <ArrowLeft className="size-4" aria-hidden />
          Back to customers
        </Link>
      </Button>

      <PageHeader
        title={customer.name}
        description={`${customer.email} · joined ${formatDateLong(customer.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/customers/${customer.id}/edit`}>Edit details</Link>
            </Button>
          <ActionForm action={setCustomerActive}>
            <input type="hidden" name="id" value={customer.id} />
            <input type="hidden" name="active" value={customer.isActive ? "false" : "true"} />
            <SubmitButton variant={customer.isActive ? "outline" : "default"}>
              {customer.isActive ? "Deactivate account" : "Reactivate account"}
            </SubmitButton>
          </ActionForm>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bookings" value={String(customer._count.bookings)} icon="CalendarCheck" />
        <StatCard
          label="Lifetime spend"
          value={bdt(Number(spend._sum?.grandTotal ?? 0))}
          icon="Wallet"
        />
        <StatCard label="Reviews" value={String(customer._count.reviews)} icon="MessageSquareText" />
        <StatCard label="Wishlist" value={String(customer._count.wishlist)} icon="Heart" />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Booking history</h2>
        <DataTable
          columns={columns}
          rows={customer.bookings}
          rowKey={(b) => b.id}
          caption="Customer bookings"
          empty={
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No bookings yet.
            </p>
          }
        />
      </section>

      {customer.reviews.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Reviews</h2>
          <ul className="space-y-3">
            {customer.reviews.map((r) => (
              <li key={r.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{r.property.name}</span>
                  <StatusBadge status={r.isApproved ? "APPROVED" : "PENDING"} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.rating}/5 · {formatDateLong(r.createdAt)}
                </p>
                {r.title ? <p className="mt-2 text-sm font-medium">{r.title}</p> : null}
                {r.comment ? (
                  <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

