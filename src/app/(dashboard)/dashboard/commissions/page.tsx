import type { Metadata } from "next";
import Link from "next/link";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type { CommissionStatus, Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Commissions", robots: { index: false } };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "EARNED", label: "Earned" },
  { value: "SETTLED", label: "Settled" },
  { value: "REVERSED", label: "Reversed" },
];

type Row = Awaited<ReturnType<typeof load>>[number];
async function load(where: Prisma.CommissionWhereInput) {
  return prisma.commission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, rate: true, baseAmount: true, amount: true, vendorPayout: true,
      status: true, createdAt: true, earnedAt: true,
      booking: {
        select: {
          id: true, reference: true,
          property: {
            select: { name: true, vendor: { select: { businessName: true } } },
          },
        },
      },
    },
  });
}

export default async function CommissionsPage({
  searchParams,
}: PageProps<"/dashboard/commissions">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? "all";

  const [commissions, totals] = await Promise.all([
    load(status !== "all" ? { status: status as CommissionStatus } : {}),
    prisma.commission.groupBy({
      by: ["status"],
      _sum: { amount: true, vendorPayout: true },
    }),
  ]);

  const sumFor = (s: string) =>
    Number(totals.find((t) => t.status === s)?._sum?.amount ?? 0);

  const columns: Column<Row>[] = [
    {
      key: "reference",
      header: "Booking",
      mobile: "title",
      cell: (c) => (
        <Link
          href={`/dashboard/bookings/${c.booking.id}`}
          className="font-mono text-xs font-semibold hover:underline"
        >
          {c.booking.reference}
        </Link>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      mobile: "body",
      cell: (c) => (
        <span className="block max-w-48 truncate text-xs">
          {c.booking.property.vendor.businessName}
          <span className="block truncate text-muted-foreground">
            {c.booking.property.name}
          </span>
        </span>
      ),
    },
    {
      key: "base",
      header: "Room revenue",
      align: "right",
      mobile: "body",
      cell: (c) => (
        <span className="tabular-nums">{bdt(Number(c.baseAmount))}</span>
      ),
    },
    {
      key: "rate",
      header: "Rate",
      mobile: "body",
      cell: (c) => <span className="tabular-nums">{Number(c.rate)}%</span>,
    },
    {
      key: "amount",
      header: "Platform",
      align: "right",
      mobile: "body",
      cell: (c) => (
        <span className="font-semibold tabular-nums text-price">
          {bdt(Number(c.amount))}
        </span>
      ),
    },
    {
      key: "payout",
      header: "Vendor payout",
      align: "right",
      mobile: "body",
      cell: (c) => (
        <span className="tabular-nums">{bdt(Number(c.vendorPayout))}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (c) => <StatusBadge status={c.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commissions"
        description="Platform earnings per booking, and what's owed to vendors."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={bdt(sumFor("PENDING"))} icon="Clock" hint="Stay not completed yet" />
        <StatCard label="Earned" value={bdt(sumFor("EARNED"))} icon="TrendingUp" hint="Awaiting settlement" />
        <StatCard label="Settled" value={bdt(sumFor("SETTLED"))} icon="CheckCheck" hint="Paid out to vendors" />
        <StatCard label="Reversed" value={bdt(sumFor("REVERSED"))} icon="Undo2" hint="Cancelled bookings" />
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
              href={
                f.value === "all"
                  ? "/dashboard/commissions"
                  : `/dashboard/commissions?status=${f.value}`
              }
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={commissions}
        rowKey={(c) => c.id}
        caption="Commissions"
        empty={<EmptyState icon="Percent" title="No commission records yet" />}
      />
    </div>
  );
}
