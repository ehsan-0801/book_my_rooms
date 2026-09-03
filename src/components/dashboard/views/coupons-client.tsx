"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { bdt, formatDateLong } from "@/lib/format";
import { deleteCoupon, toggleCoupon } from "@/lib/actions/catalog";


type Row = CouponRow;
import { TableSkeleton, PageHeaderSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";

/**
 * Rows arrive as JSON, so dates are ISO strings and Decimals are strings.
 * The formatting helpers accept both, and comparisons coerce explicitly.
 */
export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FLAT";
  value: string | number;
  maxDiscount: string | number | null;
  minSpend: string | number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  _count: { bookings: number };
}

export function CouponsClient() {
  const { data, loading } = useApi<CouponRow[]>("/api/dashboard/coupons");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={7} columns={7} />
      </div>
    );
  }

  return <CouponsView coupons={data} />;
}

function CouponsView({ coupons }: { coupons: CouponRow[] }) {
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
        const expired = new Date(c.endsAt) < now;
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

