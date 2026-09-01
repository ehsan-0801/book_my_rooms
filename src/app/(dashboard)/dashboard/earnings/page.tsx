import type { Metadata } from "next";
import Link from "next/link";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { requireVendor } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Earnings", robots: { index: false } };

export default async function EarningsPage() {
  const { vendorId } = await requireVendor();

  const [commissions, totals, payouts] = await Promise.all([
    prisma.commission.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true, rate: true, baseAmount: true, amount: true, vendorPayout: true,
        status: true, createdAt: true,
        booking: {
          select: {
            id: true, reference: true, checkOut: true,
            property: { select: { name: true } },
          },
        },
      },
    }),
    prisma.commission.groupBy({
      by: ["status"],
      where: { vendorId },
      _sum: { vendorPayout: true, amount: true, baseAmount: true },
    }),
    prisma.payout.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const sum = (status: string, key: "vendorPayout" | "amount" | "baseAmount") =>
    Number(totals.find((t) => t.status === status)?._sum?.[key] ?? 0);

  const gross = totals.reduce((n, t) => n + Number(t._sum?.baseAmount ?? 0), 0);
  const commissionPaid = sum("EARNED", "amount") + sum("SETTLED", "amount");
  const awaiting = sum("EARNED", "vendorPayout");
  const settled = sum("SETTLED", "vendorPayout");

  type Row = (typeof commissions)[number];
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
      key: "property",
      header: "Property",
      mobile: "body",
      cell: (c) => (
        <span className="block max-w-48 truncate">{c.booking.property.name}</span>
      ),
    },
    {
      key: "checkout",
      header: "Checked out",
      mobile: "body",
      cell: (c) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(c.booking.checkOut)}
        </span>
      ),
    },
    {
      key: "gross",
      header: "Room revenue",
      align: "right",
      mobile: "body",
      cell: (c) => <span className="tabular-nums">{bdt(Number(c.baseAmount))}</span>,
    },
    {
      key: "commission",
      header: `Commission`,
      align: "right",
      mobile: "body",
      cell: (c) => (
        <span className="tabular-nums text-muted-foreground">
          −{bdt(Number(c.amount))}
          <span className="block text-xs">{Number(c.rate)}%</span>
        </span>
      ),
    },
    {
      key: "payout",
      header: "Your payout",
      align: "right",
      mobile: "footer",
      cell: (c) => (
        <span className="font-semibold tabular-nums text-price">
          {bdt(Number(c.vendorPayout))}
        </span>
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
        title="Earnings"
        description="What each completed stay earned you, after platform commission."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross room revenue" value={bdt(gross)} icon="TrendingUp" />
        <StatCard
          label="Commission paid"
          value={bdt(commissionPaid)}
          icon="Percent"
          hint="Platform's share"
        />
        <StatCard
          label="Awaiting settlement"
          value={bdt(awaiting)}
          icon="Clock"
          hint="Earned, not yet paid out"
        />
        <StatCard label="Settled to date" value={bdt(settled)} icon="Wallet" />
      </div>

      {payouts.length > 0 ? (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">Payout history</h2>
          <ul className="mt-3 divide-y">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {formatDateLong(p.periodStart)} → {formatDateLong(p.periodEnd)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.reference ?? "—"} · gross {bdt(Number(p.grossAmount))} · commission{" "}
                    {bdt(Number(p.commission))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <span className="font-semibold tabular-nums">
                    {bdt(Number(p.netAmount))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Per-booking breakdown</h2>
        <DataTable
          columns={columns}
          rows={commissions}
          rowKey={(c) => c.id}
          caption="Earnings by booking"
          empty={<EmptyState icon="Wallet" title="No earnings yet" body="Completed stays show up here." />}
        />
      </section>
    </div>
  );
}
