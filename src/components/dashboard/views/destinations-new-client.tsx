"use client";

import { DestinationForm } from "@/components/dashboard/destination-form";
import { FormShell } from "@/components/dashboard/form";
import { createDistrict } from "@/lib/actions/catalog";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"destinations">;

export function NewDestinationClient() {
  const { data, loading, error } = useApi<ViewData>("/api/dashboard/destinations");

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <NewDestinationView data={data} />;
}

function NewDestinationView({ data }: { data: ViewData }) {
  const divisions = data.divisions;

  return (
    <FormShell
      title="New destination"
      description="Destinations become their own landing page and search filter."
      backHref="/dashboard/destinations"
      backLabel="Back to destinations"
    >
      <DestinationForm
        action={createDistrict}
        divisions={divisions}
        submitLabel="Create destination"
      />
    </FormShell>
  );
}

