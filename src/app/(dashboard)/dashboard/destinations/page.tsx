import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { deleteDistrict } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "Destinations", robots: { index: false } };

type Row = Awaited<ReturnType<typeof load>>[number];
async function load() {
  return prisma.district.findMany({
    orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true, tagline: true, imageUrl: true,
      isPopular: true, isActive: true,
      division: { select: { name: true } },
      _count: { select: { properties: true, areas: true } },
    },
  });
}

export default async function DestinationsPage() {
  await requireAdmin();
  const districts = await load();

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Destination",
      mobile: "title",
      cell: (d) => (
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {d.imageUrl ? (
              <Image src={d.imageUrl} alt="" fill sizes="40px" className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <span className="block max-w-52 truncate font-medium">{d.name}</span>
            <span className="block max-w-52 truncate text-xs text-muted-foreground">
              {d.tagline ?? d.division.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "division",
      header: "Division",
      mobile: "body",
      cell: (d) => <span className="text-xs">{d.division.name}</span>,
    },
    {
      key: "properties",
      header: "Properties",
      mobile: "body",
      cell: (d) => <span className="tabular-nums">{d._count.properties}</span>,
    },
    {
      key: "areas",
      header: "Areas",
      mobile: "body",
      cell: (d) => <span className="tabular-nums">{d._count.areas}</span>,
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (d) => (
        <div className="flex flex-wrap gap-1">
          <Badge className={d.isActive ? "bg-success text-white" : "bg-muted text-muted-foreground"}>
            {d.isActive ? "Active" : "Hidden"}
          </Badge>
          {d.isPopular ? <Badge variant="secondary">Homepage</Badge> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (d) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="ghost" aria-label={`View ${d.name}`}>
            <Link href={`/destinations/${d.slug}`} target="_blank">
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/destinations/${d.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </Button>
          <DeleteDialog
            action={deleteDistrict}
            id={d.id}
            title={`Delete ${d.name}`}
            description="Destinations with properties listed in them can't be deleted — move those properties first."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Destinations"
        description="Districts travellers browse and search by."
        action={
          <Button asChild>
            <Link href="/dashboard/destinations/new">
              <Plus aria-hidden />
              New destination
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={districts}
        rowKey={(d) => d.id}
        caption="Destinations"
        empty={<EmptyState icon="MapPin" title="No destinations yet" />}
      />
    </div>
  );
}
