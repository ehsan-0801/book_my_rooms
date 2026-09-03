"use client";

import Link from "next/link";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { bdt, formatDateLong } from "@/lib/format";



type ViewData = ResourceData<"earnings">;
type Row = ViewData["commissions"][number];
import { PageHeaderSkeleton, StatsSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function EarningsClient() {
  const { data, loading } = useApi<ViewData>("/api/dashboard/earnings");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton action={false} />
        <StatsSkeleton count={3} />
        <TableSkeleton rows={7} columns={7} />
      </div>
    );
  }

  return <EarningsView data={data} />;
}

function EarningsView({ data }: { data: ViewData }) {
  const commissions = data.commissions;
  const payouts = data.payouts;
  // Rebuilt from the grouped totals the resource returns.
  const at = (status: string) => data.byStatus[status];
  const gross = Object.values(data.byStatus).reduce((n, v) => n + v.base, 0);
  const commissionPaid = (at("EARNED")?.commission ?? 0) + (at("SETTLED")?.commission ?? 0);
  const awaiting = at("EARNED")?.payout ?? 0;
  const settled = at("SETTLED")?.payout ?? 0;

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

