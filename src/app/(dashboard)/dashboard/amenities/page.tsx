import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { AmenityIcon } from "@/components/property/amenity-icon";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { deleteAmenity } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "Amenities", robots: { index: false } };

type Row = Awaited<ReturnType<typeof load>>[number];
async function load() {
  return prisma.amenity.findMany({
    orderBy: [{ isFilter: "desc" }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true, icon: true, category: true, isFilter: true,
      _count: { select: { properties: true, rooms: true } },
    },
  });
}

export default async function AmenitiesPage() {
  await requireAdmin();
  const amenities = await load();

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Amenity",
      mobile: "title",
      cell: (a) => (
        <span className="flex items-center gap-2.5 font-medium">
          <AmenityIcon slug={a.slug} className="text-primary" />
          {a.name}
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      mobile: "body",
      cell: (a) => <span className="font-mono text-xs text-muted-foreground">{a.slug}</span>,
    },
    {
      key: "usage",
      header: "In use",
      mobile: "body",
      cell: (a) => (
        <span className="text-xs tabular-nums">
          {a._count.properties} properties
          <span className="block text-muted-foreground">{a._count.rooms} rooms</span>
        </span>
      ),
    },
    {
      key: "filter",
      header: "Search filter",
      mobile: "meta",
      cell: (a) =>
        a.isFilter ? (
          <Badge className="bg-success text-white">Filterable</Badge>
        ) : (
          <Badge variant="secondary">Display only</Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (a) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/amenities/${a.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </Button>
          <DeleteDialog
            action={deleteAmenity}
            id={a.id}
            title={`Delete ${a.name}`}
            description="This removes the amenity from every property and room that uses it."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amenities"
        description="The shared vocabulary properties and rooms are tagged with."
        action={
          <Button asChild>
            <Link href="/dashboard/amenities/new">
              <Plus aria-hidden />
              New amenity
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={amenities}
        rowKey={(a) => a.id}
        caption="Amenities"
        empty={<EmptyState icon="Sparkles" title="No amenities yet" />}
      />
    </div>
  );
}
