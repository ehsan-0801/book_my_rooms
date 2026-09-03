"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { bdt, formatDateLong } from "@/lib/format";
import { setCustomerActive } from "@/lib/actions/admin";
import { deleteUser } from "@/lib/actions/user";


type Row = CustomerRow;
import { PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function CustomersClient() {
  const { data, loading } = useApi<ViewData>("/api/dashboard/customers");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={7} columns={6} />
      </div>
    );
  }

  return <CustomersView data={data} />;
}

/** Inferred from the resource loader, so the view cannot drift from the query. */
type ViewData = ResourceData<"customers">;
type CustomerRow = ViewData["customers"][number];

function CustomersView({ data }: { data: ViewData }) {
  const customers = data.customers;
  const spendMap = new Map(Object.entries(data.spend));

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

