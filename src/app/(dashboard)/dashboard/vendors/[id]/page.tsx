import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { setVendorStatus } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Vendor", robots: { index: false } };

export default async function VendorDetailPage({
  params,
}: PageProps<"/dashboard/vendors/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, createdAt: true } },
      properties: {
        select: {
          id: true, name: true, slug: true, status: true, basePrice: true,
          ratingAvg: true, district: { select: { name: true, slug: true } },
          _count: { select: { rooms: true, bookings: true } },
        },
      },
      payouts: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!vendor) notFound();

  const [commissionAgg, bookingCount] = await Promise.all([
    prisma.commission.aggregate({
      where: { vendorId: id, status: { in: ["EARNED", "SETTLED"] } },
      _sum: { amount: true, vendorPayout: true, baseAmount: true },
    }),
    prisma.booking.count({ where: { property: { vendorId: id } } }),
  ]);

  type PropRow = (typeof vendor.properties)[number];
  const columns: Column<PropRow>[] = [
    {
      key: "name",
      header: "Property",
      mobile: "title",
      cell: (p) => (
        <Link
          href={`/properties/${p.district.slug}/${p.slug}`}
          target="_blank"
          className="font-medium hover:underline"
        >
          {p.name}
        </Link>
      ),
    },
    {
      key: "district",
      header: "Destination",
      mobile: "body",
      cell: (p) => <span className="text-xs">{p.district.name}</span>,
    },
    {
      key: "rooms",
      header: "Rooms",
      mobile: "body",
      cell: (p) => <span className="tabular-nums">{p._count.rooms}</span>,
    },
    {
      key: "bookings",
      header: "Bookings",
      mobile: "body",
      cell: (p) => <span className="tabular-nums">{p._count.bookings}</span>,
    },
    {
      key: "price",
      header: "From",
      align: "right",
      mobile: "body",
      cell: (p) => (
        <span className="tabular-nums">{bdt(Number(p.basePrice))}</span>
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
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
        <Link href="/dashboard/vendors">
          <ArrowLeft className="size-4" aria-hidden />
          Back to vendors
        </Link>
      </Button>

      <PageHeader
        title={vendor.businessName}
        description={`${vendor.user.name} · ${vendor.contactEmail}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={vendor.status} />
            {vendor.status !== "APPROVED" ? (
              <form action={setVendorStatus}>
                <input type="hidden" name="id" value={vendor.id} />
                <input type="hidden" name="status" value="APPROVED" />
                <Button type="submit" size="sm">Approve</Button>
              </form>
            ) : (
              <form action={setVendorStatus}>
                <input type="hidden" name="id" value={vendor.id} />
                <input type="hidden" name="status" value="SUSPENDED" />
                <Button type="submit" size="sm" variant="outline">Suspend</Button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Properties" value={String(vendor.properties.length)} icon="Building2" />
        <StatCard label="Bookings" value={String(bookingCount)} icon="CalendarCheck" />
        <StatCard
          label="Gross room revenue"
          value={bdt(Number(commissionAgg._sum?.baseAmount ?? 0))}
          icon="TrendingUp"
        />
        <StatCard
          label="Platform commission"
          value={bdt(Number(commissionAgg._sum?.amount ?? 0))}
          icon="Percent"
          hint={`${Number(vendor.commissionRate ?? 15)}% rate`}
        />
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold">Business details</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Owner", vendor.user.name],
            ["Email", vendor.contactEmail],
            ["Phone", vendor.contactPhone],
            ["Address", vendor.address ?? "—"],
            ["Trade licence", vendor.tradeLicenseNo ?? "—"],
            ["TIN", vendor.tinNumber ?? "—"],
            ["Bank", vendor.bankName ?? "—"],
            ["Account name", vendor.bankAccountName ?? "—"],
            ["Account number", vendor.bankAccountNo ?? "—"],
            ["Joined", formatDateLong(vendor.createdAt)],
            ["Approved", vendor.approvedAt ? formatDateLong(vendor.approvedAt) : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Properties</h2>
        <DataTable
          columns={columns}
          rows={vendor.properties}
          rowKey={(p) => p.id}
          caption="Vendor properties"
          empty={
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              This vendor hasn&rsquo;t listed anything yet.
            </p>
          }
        />
      </section>

      {vendor.payouts.length > 0 ? (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">Recent payouts</h2>
          <ul className="mt-3 divide-y">
            {vendor.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {formatDateLong(p.periodStart)} → {formatDateLong(p.periodEnd)}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.reference ?? "—"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <span className="font-medium tabular-nums">
                    {bdt(Number(p.netAmount))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
