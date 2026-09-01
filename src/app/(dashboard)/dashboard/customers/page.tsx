import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { requireAdmin } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { setCustomerActive } from "@/lib/actions/admin";
import { deleteUser } from "@/lib/actions/user";

export const metadata: Metadata = { title: "Customers", robots: { index: false } };

type Row = Awaited<ReturnType<typeof load>>[number];
async function load() {
  return prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, phone: true, isActive: true, createdAt: true,
      _count: { select: { bookings: true, reviews: true, wishlist: true } },
    },
  });
}

export default async function CustomersPage() {
  await requireAdmin();
  const customers = await load();

  const spend = await prisma.booking.groupBy({
    by: ["userId"],
    where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
    _sum: { grandTotal: true },
  });
  const spendMap = new Map(
    spend.filter((s) => s.userId).map((s) => [s.userId!, Number(s._sum?.grandTotal ?? 0)]),
  );

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Customer",
      mobile: "title",
      cell: (c) => (
        <div className="min-w-0">
          <span className="block max-w-52 truncate font-medium">{c.name}</span>
          <span className="block max-w-52 truncate text-xs text-muted-foreground">
            {c.email}
          </span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      mobile: "body",
      cell: (c) => <span className="text-xs whitespace-nowrap">{c.phone ?? "—"}</span>,
    },
    {
      key: "bookings",
      header: "Bookings",
      mobile: "body",
      cell: (c) => <span className="tabular-nums">{c._count.bookings}</span>,
    },
    {
      key: "reviews",
      header: "Reviews",
      mobile: "body",
      cell: (c) => <span className="tabular-nums">{c._count.reviews}</span>,
    },
    {
      key: "spend",
      header: "Lifetime spend",
      align: "right",
      mobile: "body",
      cell: (c) => (
        <span className="font-medium tabular-nums whitespace-nowrap">
          {bdt(spendMap.get(c.id) ?? 0)}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      mobile: "body",
      cell: (c) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(c.createdAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (c) => (
        <Badge className={c.isActive ? "bg-success text-white" : "bg-destructive text-white"}>
          {c.isActive ? "Active" : "Deactivated"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (c) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/customers/${c.id}`}>
              <Eye className="size-3.5" aria-hidden />
              View
            </Link>
          </Button>
          <ActionForm action={setCustomerActive}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="active" value={c.isActive ? "false" : "true"} />
            <SubmitButton size="sm" variant="ghost">
              {c.isActive ? "Deactivate" : "Reactivate"}
            </SubmitButton>
          </ActionForm>
          <DeleteDialog
            action={deleteUser}
            id={c.id}
            title={`Delete ${c.name}`}
            description="Customers with booking history can't be deleted — deactivate them instead so the financial records stay intact."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Everyone who has registered to book on the marketplace."
      />
      <DataTable
        columns={columns}
        rows={customers}
        rowKey={(c) => c.id}
        caption="Customers"
        empty={<EmptyState icon="Users" title="No customers yet" />}
      />
    </div>
  );
}
