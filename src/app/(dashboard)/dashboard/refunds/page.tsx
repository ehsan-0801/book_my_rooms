import type { Metadata } from "next";
import Link from "next/link";

import { ActionButton } from "@/components/dashboard/action-form";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { setRefundStatus } from "@/lib/actions/admin";
import type { Prisma, RefundStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Refunds", robots: { index: false } };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "REQUESTED", label: "Requested" },
  { value: "APPROVED", label: "Approved" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
];

type Row = Awaited<ReturnType<typeof load>>[number];
async function load(where: Prisma.RefundWhereInput) {
  return prisma.refund.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    take: 80,
    select: {
      id: true, amount: true, reason: true, status: true, gatewayRef: true,
      requestedAt: true, processedAt: true,
      booking: {
        select: {
          id: true, reference: true, guestName: true,
          property: { select: { name: true } },
        },
      },
    },
  });
}

export default async function RefundsPage({
  searchParams,
}: PageProps<"/dashboard/refunds">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? "all";

  const [refunds, pendingAgg, completedAgg] = await Promise.all([
    load(status !== "all" ? { status: status as RefundStatus } : {}),
    prisma.refund.aggregate({
      where: { status: { in: ["REQUESTED", "APPROVED", "PROCESSING"] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.refund.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const columns: Column<Row>[] = [
    {
      key: "reference",
      header: "Booking",
      mobile: "title",
      cell: (r) => (
        <Link
          href={`/dashboard/bookings/${r.booking.id}`}
          className="font-mono text-xs font-semibold hover:underline"
        >
          {r.booking.reference}
        </Link>
      ),
    },
    {
      key: "guest",
      header: "Guest",
      mobile: "body",
      cell: (r) => (
        <span className="block max-w-40 truncate">{r.booking.guestName}</span>
      ),
    },
    {
      key: "property",
      header: "Property",
      mobile: "body",
      cell: (r) => (
        <span className="block max-w-48 truncate text-xs">{r.booking.property.name}</span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      mobile: "body",
      cell: (r) => (
        <span className="block max-w-56 truncate text-xs text-muted-foreground">
          {r.reason ?? "—"}
        </span>
      ),
    },
    {
      key: "requested",
      header: "Requested",
      mobile: "body",
      cell: (r) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(r.requestedAt)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      mobile: "body",
      cell: (r) => (
        <span className="font-semibold tabular-nums whitespace-nowrap">
          {bdt(Number(r.amount))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (r) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          {r.status === "REQUESTED" ? (
            <>
              <ActionButton
                action={setRefundStatus}
                values={{ id: r.id, status: "APPROVED" }}
                size="sm"
                pendingLabel="Approving…"
              >
                Approve
              </ActionButton>
              <ActionButton
                action={setRefundStatus}
                values={{ id: r.id, status: "REJECTED" }}
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                pendingLabel="Rejecting…"
              >
                Reject
              </ActionButton>
            </>
          ) : null}
          {r.status === "APPROVED" ? (
            <ActionButton
              action={setRefundStatus}
              values={{ id: r.id, status: "PROCESSING" }}
              size="sm"
              variant="outline"
              pendingLabel="Sending…"
            >
              Send to gateway
            </ActionButton>
          ) : null}
          {r.status === "PROCESSING" ? (
            <ActionButton
              action={setRefundStatus}
              values={{ id: r.id, status: "COMPLETED" }}
              size="sm"
              pendingLabel="Completing…"
            >
              Mark refunded
            </ActionButton>
          ) : null}
          {["COMPLETED", "REJECTED"].includes(r.status) ? (
            <span className="text-xs text-muted-foreground">
              {r.processedAt ? formatDateLong(r.processedAt) : "—"}
            </span>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refunds"
        description="Cancellation refunds moving through approval and the gateway (SRS §28)."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Awaiting action"
          value={bdt(Number(pendingAgg._sum?.amount ?? 0))}
          icon="Clock"
          hint={`${pendingAgg._count?._all ?? 0} request${(pendingAgg._count?._all ?? 0) === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Refunded to date"
          value={bdt(Number(completedAgg._sum?.amount ?? 0))}
          icon="Undo2"
          hint={`${completedAgg._count?._all ?? 0} completed`}
        />
      </div>

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
              href={f.value === "all" ? "/dashboard/refunds" : `/dashboard/refunds?status=${f.value}`}
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={refunds}
        rowKey={(r) => r.id}
        caption="Refunds"
        empty={<EmptyState icon="Undo2" title="No refunds match this filter" />}
      />
    </div>
  );
}
