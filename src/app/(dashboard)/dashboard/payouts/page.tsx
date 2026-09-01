import type { Metadata } from "next";

import { ActionButton } from "@/components/dashboard/action-form";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { createPayout } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Payouts", robots: { index: false } };

export default async function PayoutsPage() {
  await requireAdmin();

  const [payouts, owing, settledAgg] = await Promise.all([
    prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true, periodStart: true, periodEnd: true, grossAmount: true,
        commission: true, netAmount: true, status: true, reference: true,
        paidAt: true,
        vendor: { select: { businessName: true } },
      },
    }),
    // Everything earned but not yet attached to a payout, grouped by vendor.
    prisma.commission.groupBy({
      by: ["vendorId"],
      where: { status: "EARNED", payoutId: null },
      _sum: { vendorPayout: true },
      _count: { _all: true },
    }),
    prisma.payout.aggregate({ where: { status: "PAID" }, _sum: { netAmount: true } }),
  ]);

  const vendors = await prisma.vendor.findMany({
    where: { id: { in: owing.map((o) => o.vendorId) } },
    select: { id: true, businessName: true },
  });
  const vendorName = new Map(vendors.map((v) => [v.id, v.businessName]));

  const pendingTotal = owing.reduce(
    (n, o) => n + Number(o._sum?.vendorPayout ?? 0),
    0,
  );

  type PayoutRow = (typeof payouts)[number];
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
