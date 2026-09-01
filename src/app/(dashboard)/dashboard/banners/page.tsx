import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { toggleBanner } from "@/lib/actions/admin";
import { deleteBanner } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "Banners", robots: { index: false } };

type Row = Awaited<ReturnType<typeof load>>[number];
async function load() {
  return prisma.banner.findMany({ orderBy: [{ position: "asc" }, { sortOrder: "asc" }] });
}

const POSITION_LABEL: Record<string, string> = {
  home_hero: "Homepage hero",
  home_mid: "Homepage mid",
  search_side: "Search sidebar",
};

export default async function BannersPage() {
  await requireAdmin();
  const banners = await load();

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Banner",
      mobile: "title",
      cell: (b) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {b.imageUrl ? (
              <Image src={b.imageUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : null}
          </div>
          <span className="block max-w-60 truncate font-medium">{b.title}</span>
        </div>
      ),
    },
    {
      key: "position",
      header: "Placement",
      mobile: "body",
      cell: (b) => (
        <span className="text-xs whitespace-nowrap">
          {POSITION_LABEL[b.position] ?? b.position}
          <span className="block text-muted-foreground">order {b.sortOrder}</span>
        </span>
      ),
    },
    {
      key: "performance",
      header: "Performance",
      mobile: "body",
      cell: (b) => {
        const ctr = b.impressions ? (b.clicks / b.impressions) * 100 : 0;
        return (
          <span className="text-xs whitespace-nowrap tabular-nums">
            {b.clicks.toLocaleString("en-BD")} clicks
            <span className="block text-muted-foreground">
              {b.impressions.toLocaleString("en-BD")} views · {ctr.toFixed(1)}% CTR
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (b) => (
        <Badge className={b.isActive ? "bg-success text-white" : "bg-muted text-muted-foreground"}>
          {b.isActive ? "Live" : "Paused"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (b) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <form action={toggleBanner}>
            <input type="hidden" name="id" value={b.id} />
            <Button type="submit" size="sm" variant="ghost">
              {b.isActive ? "Pause" : "Activate"}
            </Button>
          </form>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/banners/${b.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </Button>
          <DeleteDialog
            action={deleteBanner}
            id={b.id}
            title={`Delete "${b.title}"`}
            description="The banner is removed from every placement immediately."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        description="Promotional artwork on the homepage and search results."
        action={
          <Button asChild>
            <Link href="/dashboard/banners/new">
              <Plus aria-hidden />
              New banner
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={banners}
        rowKey={(b) => b.id}
        caption="Banners"
        empty={
          <EmptyState
            icon="Megaphone"
            title="No banners yet"
            action={
              <Button asChild>
                <Link href="/dashboard/banners/new">New banner</Link>
              </Button>
            }
          />
        }
      />
    </div>
  );
}
