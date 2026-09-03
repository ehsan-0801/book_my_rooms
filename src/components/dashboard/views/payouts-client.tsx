"use client";

import { ActionButton } from "@/components/dashboard/action-form";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { bdt, formatDateLong } from "@/lib/format";
import { createPayout } from "@/lib/actions/admin";



type ViewData = ResourceData<"payouts">;
import { PageHeaderSkeleton, StatsSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function PayoutsClient() {
  const { data, loading } = useApi<ViewData>("/api/dashboard/payouts");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton action={false} />
        <StatsSkeleton count={3} />
        <TableSkeleton rows={7} columns={7} />
      </div>
    );
  }

  return <PayoutsView data={data} />;
}

type PayoutRow = ViewData["payouts"][number];

function PayoutsView({ data }: { data: ViewData }) {
  const payouts = data.payouts;
  const owing = data.owing.map((o) => ({
    vendorId: o.vendorId,
    _sum: { vendorPayout: o.amount },
    _count: { _all: o.count },
  }));
  const vendorName = new Map(data.owing.map((o) => [o.vendorId, o.businessName]));
  const pendingTotal = data.owing.reduce((n, o) => n + o.amount, 0);
  const settledAgg = { _sum: { netAmount: data.settledTotal } };

  const columns: Column<PayoutRow>[] = [
    {
      key: "vendor",
      header: "Vendor",
      mobile: "title",
      cell: (p) => <span className="font-medium">{p.vendor.businessName}</span>,
    },
    {
      key: "period",
      header: "Period",
      mobile: "body",
      cell: (p) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(p.periodStart)} → {formatDateLong(p.periodEnd)}
        </span>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      mobile: "body",
      cell: (p) => (
        <span className="font-mono text-xs text-muted-foreground">
          {p.reference ?? "—"}
        </span>
      ),
    },
    {
      key: "gross",
      header: "Gross",
      align: "right",
      mobile: "body",
      cell: (p) => <span className="tabular-nums">{bdt(Number(p.grossAmount))}</span>,
    },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      mobile: "body",
      cell: (p) => (
        <span className="tabular-nums text-muted-foreground">
          −{bdt(Number(p.commission))}
        </span>
      ),
    },
    {
      key: "net",
      header: "Paid out",
      align: "right",
      mobile: "footer",
      cell: (p) => (
        <span className="font-semibold tabular-nums text-price">
          {bdt(Number(p.netAmount))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Settle earned commission to vendors and review past settlements (SRS §84)."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Awaiting settlement"
          value={bdt(pendingTotal)}
          icon="Clock"
          hint={`${owing.length} vendor${owing.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Settled to date"
          value={bdt(Number(settledAgg._sum?.netAmount ?? 0))}
          icon="Wallet"
        />
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold">Ready to settle</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creating a payout marks every earned commission for that vendor as
          settled, in one batch.
        </p>

        {owing.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nothing is awaiting settlement.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {owing.map((o) => (
              <li
                key={o.vendorId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {vendorName.get(o.vendorId) ?? "Unknown vendor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o._count?._all ?? 0} booking
                    {(o._count?._all ?? 0) === 1 ? "" : "s"} earned
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums text-price">
                    {bdt(Number(o._sum?.vendorPayout ?? 0))}
                  </span>
                  <ActionButton
                    action={createPayout}
                    values={{ vendorId: o.vendorId }}
                    size="sm"
                    pendingLabel="Settling…"
                  >
                    Settle
                  </ActionButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Payout history</h2>
        <DataTable
          columns={columns}
          rows={payouts}
          rowKey={(p) => p.id}
          caption="Payouts"
          empty={<EmptyState icon="Wallet" title="No payouts yet" />}
        />
      </section>
    </div>
  );
}

