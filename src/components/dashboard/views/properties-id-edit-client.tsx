"use client";

import { FormShell } from "@/components/dashboard/form";
import { PropertyForm } from "@/components/dashboard/property-form";
import { updateProperty } from "@/lib/actions/property";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"properties/form">;

export function EditPropertyClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/properties/form/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditPropertyView data={data} />;
}

function EditPropertyView({ data }: { data: ViewData }) {
  const { types, districts, amenities } = data;
  const property = data.property!;

  return (
    <FormShell
      title={`Edit ${property.name}`}
      description="Changes go live immediately for a published property."
      backHref="/dashboard/properties"
      backLabel="Back to properties"
    >
      <PropertyForm
        action={updateProperty}
        types={types}
        districts={districts}
        amenities={amenities}
        submitLabel="Save changes"
        property={{
          ...property,
          basePrice: Number(property.basePrice),
          amenityIds: property.amenities.map((a) => a.amenityId),
          images: property.images.map((img) => ({
            url: img.url,
            publicId: "",
            width: 0,
            height: 0,
          })),
        }}
      />
    </FormShell>
  );
}

