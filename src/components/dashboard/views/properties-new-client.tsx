"use client";

import { FormShell } from "@/components/dashboard/form";
import { PropertyForm } from "@/components/dashboard/property-form";
import { createProperty } from "@/lib/actions/property";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"properties/form">;

export function NewPropertyClient() {
  const { data, loading, error } = useApi<ViewData>("/api/dashboard/properties/form");

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <NewPropertyView data={data} />;
}

function NewPropertyView({ data }: { data: ViewData }) {
  const { types, districts, amenities } = data;
  const vendors = data.vendors ?? undefined;
  const isAdmin = vendors !== null;

  return (
    <FormShell
      title="Add a property"
      description={
        isAdmin
          ? "Created as published. Assign it to the vendor who runs it."
          : "Your listing goes to an admin for review before it appears in search."
      }
      backHref="/dashboard/properties"
      backLabel="Back to properties"
    >
      <PropertyForm
        action={createProperty}
        types={types}
        districts={districts}
        amenities={amenities}
        vendors={vendors}
        submitLabel="Create property"
      />
    </FormShell>
  );
}

