"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Star } from "lucide-react";

import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { bdt } from "@/lib/format";
import { setPropertyStatus, togglePropertyFeatured } from "@/lib/actions/admin";
import { deleteProperty } from "@/lib/actions/property";


const FILTERS = [
  { value: "all", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNPUBLISHED", label: "Unpublished" },
];

type ViewData = ResourceData<"properties">;
type Row = ViewData["properties"][number];
import { useSearchParams } from "next/navigation";
import { FiltersSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function PropertiesClient() {
  // The URL is the query: any filter change refetches.
  const params = useSearchParams();
  const { data, loading } = useApi<ViewData>(
    `/api/dashboard/properties?${params.toString()}`,
  );

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <FiltersSkeleton count={5} />
        <TableSkeleton rows={7} columns={7} />
      </div>
    );
  }

  return <PropertiesView data={data} params={params} />;
}

function PropertiesView({
  data,
  params,
}: {
  data: ViewData;
  params: URLSearchParams;
}) {
  const properties = data.properties;
  const isAdmin = data.role === "ADMIN";
  const status = params.get("status") ?? "all";

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Property",
      mobile: "title",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {p.images[0] ? (
              <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <span className="block max-w-56 truncate font-medium">{p.name}</span>
            <span className="block text-xs text-muted-foreground">
              {p.district.name}
              {p.isFeatured ? " · Featured" : ""}
              {p.isPremium ? " · Premium" : ""}
            </span>
          </div>
        </div>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "vendor",
            header: "Vendor",
            mobile: "body" as const,
            cell: (p: Row) => (
              <span className="block max-w-40 truncate text-xs">{p.vendor.businessName}</span>
            ),
          },
        ]
      : []),
    {
      key: "type",
      header: "Type",
      mobile: "body",
      cell: (p) => (
        <span className="text-xs">
          {p.type.name}
          <span className="block text-muted-foreground capitalize">
            {p.category.toLowerCase()}
          </span>
        </span>
      ),
    },
    {
      key: "rooms",
      header: "Rooms",
      mobile: "body",
      cell: (p) => <span className="tabular-nums">{p._count.rooms}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      mobile: "body",
      cell: (p) => (
        <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap">
          <Star className="size-3.5 fill-rating text-rating" aria-hidden />
          {Number(p.ratingAvg).toFixed(1)}
          <span className="text-muted-foreground">({p.ratingCount})</span>
        </span>
      ),
    },
    {
      key: "price",
      header: "From",
      align: "right",
      mobile: "body",
      cell: (p) => (
        <span className="font-medium tabular-nums whitespace-nowrap">
          {bdt(Number(p.basePrice))}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (p) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="ghost" aria-label={`View ${p.name}`}>
            <Link href={`/properties/${p.district.slug}/${p.slug}`} target="_blank">
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/properties/${p.id}/edit`}>
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </Button>

          {isAdmin ? (
            <>
              <ActionForm action={setPropertyStatus}>
                <input type="hidden" name="id" value={p.id} />
                <input
                  type="hidden"
                  name="status"
                  value={p.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED"}
                />
                <SubmitButton
                  size="sm"
                  variant={p.status === "PUBLISHED" ? "outline" : "default"}
                >
                  {p.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </SubmitButton>
              </ActionForm>
              <ActionForm action={togglePropertyFeatured}>
                <input type="hidden" name="id" value={p.id} />
                <SubmitButton
                  size="sm"
                  variant={p.isFeatured ? "secondary" : "ghost"}
                  aria-label={p.isFeatured ? "Unfeature" : "Feature"}
                >
                  <Star
                    className={p.isFeatured ? "size-4 fill-rating text-rating" : "size-4"}
                    aria-hidden
                  />
                </SubmitButton>
              </ActionForm>
            </>
          ) : null}

          <DeleteDialog
            action={deleteProperty}
            id={p.id}
            title={`Delete ${p.name}`}
            description="This removes the property, its rooms, images and availability. Bookings that already completed keep their records. This cannot be undone."
            confirmText="DELETE"
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "Properties" : "My properties"}
        description={
          isAdmin
            ? "Every listing on the marketplace — approve, feature or remove."
            : "Your listings, their status and how they're performing."
        }
        action={
          <Button asChild>
            <Link href="/dashboard/properties/new">
              <Plus aria-hidden />
              Add property
            </Link>
          </Button>
        }
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
              href={
                f.value === "all"
                  ? "/dashboard/properties"
                  : `/dashboard/properties?status=${f.value}`
              }
            >
              {f.label}
            </Link>
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={properties}
        rowKey={(p) => p.id}
        caption="Properties"
        empty={
          <EmptyState
            icon="Building2"
            title="No properties here"
            body={
              isAdmin
                ? "No listings match this filter."
                : "Add your first property to start receiving bookings."
            }
            action={
              <Button asChild>
                <Link href="/dashboard/properties/new">Add property</Link>
              </Button>
            }
          />
        }
      />
    </div>
  );
}

