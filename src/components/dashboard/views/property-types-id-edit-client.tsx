"use client";

import { FormShell } from "@/components/dashboard/form";
import { PropertyTypeForm } from "@/components/dashboard/property-type-form";
import { updatePropertyType } from "@/lib/actions/catalog";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"property-types/detail">;

export function EditPropertyTypeClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/property-types/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditPropertyTypeView data={data} />;
}

function EditPropertyTypeView({ data: type }: { data: ViewData }) {

  return (
    <FormShell
      title={`Edit ${type.name}`}
      backHref="/dashboard/property-types"
      backLabel="Back to property types"
    >
      <PropertyTypeForm action={updatePropertyType} type={type} submitLabel="Save changes" />
    </FormShell>
  );
}

