import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { deleteCoupon, toggleCoupon } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "Coupons", robots: { index: false } };

type Row = Awaited<ReturnType<typeof load>>[number];

async function load() {
  return prisma.coupon.findMany({
    orderBy: [{ isActive: "desc" }, { endsAt: "desc" }],
    select: {
      id: true, code: true, description: true, type: true, value: true,
      maxDiscount: true, minSpend: true, usageLimit: true, usageCount: true,
      startsAt: true, endsAt: true, isActive: true,
      _count: { select: { bookings: true } },
    },
  });
}

export default async function CouponsPage() {
  await requireAdmin();
  const coupons = await load();
  const now = new Date();

  const columns: Column<Row>[] = [
    {
      key: "code",
      header: "Code",
      mobile: "title",
      cell: (c) => (
        <div>
          <span className="font-mono font-semibold tracking-wide">{c.code}</span>
          {c.description ? (
            <span className="block max-w-56 truncate text-xs font-normal text-muted-foreground">
              {c.description}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      mobile: "body",
      cell: (c) => (
        <span className="whitespace-nowrap">
          {c.type === "PERCENTAGE" ? `${Number(c.value)}%` : bdt(Number(c.value))}
          {c.maxDiscount ? (
            <span className="block text-xs text-muted-foreground">
              max {bdt(Number(c.maxDiscount))}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "minSpend",
      header: "Min spend",
      mobile: "body",
      cell: (c) => (
        <span className="tabular-nums">
          {c.minSpend ? bdt(Number(c.minSpend)) : "—"}
        </span>
      ),
    },
    {
      key: "usage",
      header: "Used",
      mobile: "body",
      cell: (c) => (
        <span className="tabular-nums">
          {c.usageCount}
          {c.usageLimit ? ` / ${c.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "window",
      header: "Valid",
      mobile: "body",
      cell: (c) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(c.startsAt)}
          <br />→ {formatDateLong(c.endsAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (c) => {
        const expired = c.endsAt < now;
        return (
          <Badge
            className={
              expired
                ? "bg-muted text-muted-foreground"
                : c.isActive
                  ? "bg-success text-white"
                  : "bg-muted text-muted-foreground"
            }
          >
            {expired ? "Expired" : c.isActive ? "Active" : "Paused"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (c) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <ActionForm action={toggleCoupon}>
            <input type="hidden" name="id" value={c.id} />
            <SubmitButton size="sm" variant="ghost">
              {c.isActive ? "Pause" : "Activate"}
            </SubmitButton>
          </ActionForm>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/coupons/${c.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </Button>
          <DeleteDialog
            action={deleteCoupon}
            id={c.id}
            title={`Delete ${c.code}`}
            description="Coupons already used on a booking can't be deleted — pause them instead."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        description="Platform-wide promo codes travellers can apply at checkout."
        action={
          <Button asChild>
            <Link href="/dashboard/coupons/new">
              <Plus aria-hidden />
              New coupon
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={coupons}
        rowKey={(c) => c.id}
        caption="Coupons"
        empty={
          <EmptyState
            icon="TicketPercent"
            title="No coupons yet"
            body="Create a promo code to run a campaign."
            action={
              <Button asChild>
                <Link href="/dashboard/coupons/new">New coupon</Link>
              </Button>
            }
          />
        }
      />
    </div>
  );
}
