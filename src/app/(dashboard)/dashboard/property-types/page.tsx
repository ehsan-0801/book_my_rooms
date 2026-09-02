import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { AmenityIcon } from "@/components/property/amenity-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { deletePropertyType } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "Property types", robots: { index: false } };

type Row = Awaited<ReturnType<typeof load>>[number];
async function load() {
  return prisma.propertyType.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true, icon: true, sortOrder: true, isActive: true,
      _count: { select: { properties: true } },
    },
  });
}

export default async function PropertyTypesPage() {
  await requireAdmin();
  const types = await load();

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Type",
      mobile: "title",
      cell: (t) => (
        <span className="flex items-center gap-2.5 font-medium">
          <AmenityIcon icon={t.icon} className="text-primary" />
          {t.name}
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      mobile: "body",
      cell: (t) => <span className="font-mono text-xs text-muted-foreground">{t.slug}</span>,
    },
    {
      key: "order",
      header: "Order",
      mobile: "body",
      cell: (t) => <span className="tabular-nums">{t.sortOrder}</span>,
    },
    {
      key: "usage",
      header: "Properties",
      mobile: "body",
      cell: (t) => <span className="tabular-nums">{t._count.properties}</span>,
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (t) => (
        <Badge className={t.isActive ? "bg-success text-white" : "bg-muted text-muted-foreground"}>
          {t.isActive ? "Active" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (t) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/property-types/${t.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </Button>
          <DeleteDialog
            action={deletePropertyType}
            id={t.id}
            title={`Delete ${t.name}`}
            description="Types still used by a property can't be deleted — reassign those listings first."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property types"
        description="The accommodation categories vendors can list under (SRS §7.1)."
        action={
          <Button asChild>
            <Link href="/dashboard/property-types/new">
              <Plus aria-hidden />
              New type
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={types}
        rowKey={(t) => t.id}
        caption="Property types"
        empty={<EmptyState icon="Building2" title="No property types yet" />}
      />
    </div>
  );
}
