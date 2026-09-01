import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { setVendorCommission, setVendorStatus } from "@/lib/actions/admin";
import { deleteVendor } from "@/lib/actions/user";
import type { Prisma, VendorStatus } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Vendors", robots: { index: false } };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REJECTED", label: "Rejected" },
];

type Row = Awaited<ReturnType<typeof load>>[number];
async function load(where: Prisma.VendorWhereInput) {
  return prisma.vendor.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, businessName: true, contactEmail: true, contactPhone: true,
      status: true, commissionRate: true, createdAt: true,
      user: { select: { name: true } },
      _count: { select: { properties: true } },
    },
  });
}

export default async function VendorsPage({
  searchParams,
}: PageProps<"/dashboard/vendors">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? "all";

  const vendors = await load(
    status !== "all" ? { status: status as VendorStatus } : {},
  );

  const earned = await prisma.commission.groupBy({
    by: ["vendorId"],
    where: { status: { in: ["EARNED", "SETTLED"] } },
    _sum: { amount: true },
  });
  const earnedMap = new Map(earned.map((e) => [e.vendorId, Number(e._sum?.amount ?? 0)]));

  const columns: Column<Row>[] = [
    {
      key: "business",
      header: "Business",
      mobile: "title",
      cell: (v) => (
        <div className="min-w-0">
          <span className="block max-w-52 truncate font-medium">{v.businessName}</span>
          <span className="block text-xs text-muted-foreground">
            {v.user.name} · joined {formatDateLong(v.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      mobile: "body",
      cell: (v) => (
        <span className="block text-xs whitespace-nowrap">
          {v.contactEmail}
          <span className="block text-muted-foreground">{v.contactPhone}</span>
        </span>
      ),
    },
    {
      key: "properties",
      header: "Properties",
      mobile: "body",
      cell: (v) => <span className="tabular-nums">{v._count.properties}</span>,
    },
    {
      key: "commission",
      header: "Commission",
      mobile: "body",
      cell: (v) => (
        <ActionForm action={setVendorCommission} className="flex items-center gap-1">
          <input type="hidden" name="id" value={v.id} />
          <Input
            name="rate"
            type="number"
            min={0}
            max={50}
            step={0.5}
            defaultValue={Number(v.commissionRate ?? 15)}
            aria-label={`Commission rate for ${v.businessName}`}
            className="h-8 w-20"
          />
          <span className="text-xs text-muted-foreground">%</span>
          <SubmitButton size="sm" variant="ghost" className="h-8 px-2 text-xs">
            Save
          </SubmitButton>
        </ActionForm>
      ),
    },
    {
      key: "earned",
      header: "Platform earned",
      align: "right",
      mobile: "body",
      cell: (v) => (
        <span className="font-medium tabular-nums whitespace-nowrap">
          {bdt(earnedMap.get(v.id) ?? 0)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (v) => <StatusBadge status={v.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (v) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/vendors/${v.id}`}>
              <Eye className="size-3.5" aria-hidden />
              View
            </Link>
          </Button>
          {v.status !== "APPROVED" ? (
            <ActionForm action={setVendorStatus}>
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="status" value="APPROVED" />
              <SubmitButton size="sm">Approve</SubmitButton>
            </ActionForm>
          ) : null}
          {v.status === "PENDING" ? (
            <ActionForm action={setVendorStatus}>
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="status" value="REJECTED" />
              <SubmitButton size="sm" variant="outline">Reject</SubmitButton>
            </ActionForm>
          ) : null}
          {v.status === "APPROVED" ? (
            <ActionForm action={setVendorStatus}>
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="status" value="SUSPENDED" />
              <SubmitButton
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
              >
                Suspend
              </SubmitButton>
            </ActionForm>
          ) : null}
          <DeleteDialog
            action={deleteVendor}
            id={v.id}
            title={`Delete ${v.businessName}`}
            description="Vendors that still have properties can't be deleted. Suspend them instead if you only want to take them offline."
            confirmText="DELETE"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Approve applications, adjust commission and suspend accounts."
      />

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
              href={f.value === "all" ? "/dashboard/vendors" : `/dashboard/vendors?status=${f.value}`}
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={vendors}
        rowKey={(v) => v.id}
        caption="Vendors"
        empty={<EmptyState icon="Store" title="No vendors match this filter" />}
      />
    </div>
  );
}
