"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLong } from "@/lib/format";
import { deleteContentPage } from "@/lib/actions/catalog";


type Row = ContentPageRow;
import { PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function ContentPagesClient() {
  const { data, loading } = useApi<ViewData>("/api/dashboard/pages");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={7} columns={6} />
      </div>
    );
  }

  return <ContentPagesView data={data} />;
}

/** Inferred from the resource loader, so the view cannot drift from the query. */
type ViewData = ResourceData<"pages">;
type ContentPageRow = ViewData[number];

function ContentPagesView({ data: pages }: { data: ViewData }) {

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Page",
      mobile: "title",
      cell: (p) => (
        <div className="min-w-0">
          <span className="block max-w-64 truncate font-medium">{p.title}</span>
          <span className="block font-mono text-xs text-muted-foreground">/{p.slug}</span>
        </div>
      ),
    },
    {
      key: "excerpt",
      header: "Excerpt",
      mobile: "body",
      cell: (p) => (
        <span className="block max-w-md truncate text-xs text-muted-foreground">
          {p.body.slice(0, 120)}
        </span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      mobile: "body",
      cell: (p) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(p.updatedAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (p) => (
        <Badge className={p.isPublished ? "bg-success text-white" : "bg-muted text-muted-foreground"}>
          {p.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (p) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/pages/${p.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </Button>
          <DeleteDialog
            action={deleteContentPage}
            id={p.id}
            title={`Delete ${p.title}`}
            description="The page and its URL are removed immediately."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content pages"
        description="Static pages like About, Terms and Privacy (SRS §59)."
        action={
          <Button asChild>
            <Link href="/dashboard/pages/new">
              <Plus aria-hidden />
              New page
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={pages}
        rowKey={(p) => p.id}
        caption="Content pages"
        empty={<EmptyState icon="FileText" title="No pages yet" />}
      />
    </div>
  );
}

