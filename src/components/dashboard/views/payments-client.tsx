"use client";

import Link from "next/link";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { bdt, formatDateLong } from "@/lib/format";


type ViewData = ResourceData<"payments">;
type Row = ViewData["payments"][number];
import { PageHeaderSkeleton, StatsSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function PaymentsClient() {
  const { data, loading } = useApi<ViewData>("/api/dashboard/payments");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton action={false} />
        <StatsSkeleton count={3} />
        <TableSkeleton rows={7} columns={7} />
      </div>
    );
  }

  return <PaymentsView data={data} />;
}

function PaymentsView({ data }: { data: ViewData }) {
  const payments = data.payments;
  const paidAgg = { _sum: { amount: data.paidTotal } };
  const refundAgg = { _sum: { amount: data.refundedTotal } };
  const pendingCount = data.pendingRefunds;

  const columns: Column<Row>[] = [
    {
      key: "reference",
      header: "Booking",
      mobile: "title",
      cell: (p) => (
        <Link
          href={`/dashboard/bookings/${p.booking.id}`}
          className="font-mono text-xs font-semibold hover:underline"
        >
          {p.booking.reference}
        </Link>
      ),
    },
    {
      key: "guest",
      header: "Guest",
      mobile: "body",
      cell: (p) => <span className="whitespace-nowrap">{p.booking.guestName}</span>,
    },
    {
      key: "property",
      header: "Property",
      mobile: "body",
      cell: (p) => (
        <span className="block max-w-48 truncate">{p.booking.property.name}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      mobile: "body",
      cell: (p) => <span className="text-xs whitespace-nowrap">{p.method}</span>,
    },
    {
      key: "ref",
      header: "Gateway ref",
      mobile: "body",
      cell: (p) => (
        <span className="font-mono text-xs text-muted-foreground">
          {p.gatewayRef ?? "—"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      mobile: "body",
      cell: (p) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(p.paidAt ?? p.createdAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mobile: "footer",
      cell: (p) => (
        <span className="font-semibold tabular-nums whitespace-nowrap">
          {bdt(Number(p.amount))}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every gateway transaction across the marketplace."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total collected"
          value={bdt(Number(paidAgg._sum?.amount ?? 0))}
          icon="CreditCard"
        />
        <StatCard
          label="Total refunded"
          value={bdt(Number(refundAgg._sum?.amount ?? 0))}
          icon="Undo2"
        />
        <StatCard
          label="Refunds in progress"
          value={String(pendingCount)}
          icon="Clock"
          hint="Requested, approved or processing"
        />
      </div>

      <DataTable
        columns={columns}
        rows={payments}
        rowKey={(p) => p.id}
        caption="Payments"
        empty={<EmptyState icon="CreditCard" title="No payments recorded yet" />}
      />
    </div>
  );
}

