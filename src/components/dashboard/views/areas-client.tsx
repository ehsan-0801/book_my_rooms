"use client";

import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { FormSection, SelectField, TextField } from "@/components/dashboard/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createArea, deleteArea, updateArea } from "@/lib/actions/catalog";


type ViewData = ResourceData<"areas">;
type Row = ViewData["areas"][number];
import { PageHeaderSkeleton, TableSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

export function AreasClient() {
  const { data, loading } = useApi<ViewData>("/api/dashboard/areas");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <TableSkeleton rows={7} columns={6} />
      </div>
    );
  }

  return <AreasView data={data} />;
}

function AreasView({ data }: { data: ViewData }) {
  const areas = data.areas;
  const districts = data.districts;

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Area",
      mobile: "title",
      // Inline rename — an area is a single field, so a whole edit page
      // would be more navigation than the change is worth.
      cell: (a) => (
        <ActionForm action={updateArea} className="flex items-center gap-1.5">
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="isActive" value={String(a.isActive)} />
          <Input
            name="name"
            defaultValue={a.name}
            aria-label={`Rename ${a.name}`}
            className="h-8 w-44"
          />
          <SubmitButton size="sm" variant="ghost" className="h-8 px-2 text-xs">
            Save
          </SubmitButton>
        </ActionForm>
      ),
    },
    {
      key: "district",
      header: "Destination",
      mobile: "body",
      cell: (a) => <span className="text-sm">{a.district.name}</span>,
    },
    {
      key: "slug",
      header: "Slug",
      mobile: "body",
      cell: (a) => <span className="font-mono text-xs text-muted-foreground">{a.slug}</span>,
    },
    {
      key: "properties",
      header: "Properties",
      mobile: "body",
      cell: (a) => <span className="tabular-nums">{a._count.properties}</span>,
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (a) => (
        <Badge className={a.isActive ? "bg-success text-white" : "bg-muted text-muted-foreground"}>
          {a.isActive ? "Active" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (a) => (
        <DeleteDialog
          action={deleteArea}
          id={a.id}
          title={`Delete ${a.name}`}
          description="Areas with properties assigned to them can't be deleted — reassign those listings first."
          iconOnly
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Areas"
        description="Neighbourhoods and upazilas within each destination (SRS §8)."
      />

      <ActionForm action={createArea}>
        <FormSection title="Add an area">
          <SelectField
            label="Destination"
            name="districtId"
            required
            options={districts.map((d) => ({ value: d.id, label: d.name }))}
          />
          <TextField
            label="Area name"
            name="name"
            required
            placeholder="e.g. Inani Beach"
          />
          <div className="sm:col-span-2">
            <SubmitButton>Add area</SubmitButton>
          </div>
        </FormSection>
      </ActionForm>

      <DataTable
        columns={columns}
        rows={areas}
        rowKey={(a) => a.id}
        caption="Areas"
        empty={<EmptyState icon="MapPin" title="No areas yet" body="Add one above." />}
      />
    </div>
  );
}

