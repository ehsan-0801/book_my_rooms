import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { PageHeader, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { setCustomerActive } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Customer", robots: { index: false } };

export default async function CustomerDetailPage({
  params,
}: PageProps<"/dashboard/customers/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true, name: true, email: true, phone: true, isActive: true,
      createdAt: true, emailVerified: true,
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, reference: true, checkIn: true, checkOut: true,
          grandTotal: true, status: true,
          property: { select: { name: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, rating: true, title: true, comment: true, isApproved: true,
          createdAt: true, property: { select: { name: true } },
        },
      },
      _count: { select: { bookings: true, reviews: true, wishlist: true } },
    },
  });
  if (!customer) notFound();

  const spend = await prisma.booking.aggregate({
    where: { userId: id, status: { in: ["CONFIRMED", "COMPLETED"] } },
    _sum: { grandTotal: true },
  });

  type BookingRow = (typeof customer.bookings)[number];
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
