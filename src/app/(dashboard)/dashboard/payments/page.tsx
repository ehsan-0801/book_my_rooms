import type { Metadata } from "next";
import Link from "next/link";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Payments", robots: { index: false } };

type Row = Awaited<ReturnType<typeof load>>[number];
async function load() {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, method: true, amount: true, status: true, gatewayRef: true,
      paidAt: true, createdAt: true,
      booking: {
        select: {
          id: true, reference: true, guestName: true,
          property: { select: { name: true } },
        },
      },
    },
  });
}

export default async function PaymentsPage() {
  await requireAdmin();
  const [payments, paidAgg, refundAgg, pendingCount] = await Promise.all([
    load(),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.refund.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.refund.count({ where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } } }),
  ]);

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
