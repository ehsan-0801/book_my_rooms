"use client";

import { DestinationForm } from "@/components/dashboard/destination-form";
import { FormShell } from "@/components/dashboard/form";
import { updateDistrict } from "@/lib/actions/catalog";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"destinations/detail">;

export function EditDestinationClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/destinations/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditDestinationView data={data} />;
}

function EditDestinationView({ data }: { data: ViewData }) {
  const { divisions, district } = data;

  return (
    <FormShell
      title={`Edit ${district.name}`}
      backHref="/dashboard/destinations"
      backLabel="Back to destinations"
    >
      <DestinationForm
        action={updateDistrict}
        divisions={divisions}
        destination={district}
        submitLabel="Save changes"
      />
    </FormShell>
  );
}

