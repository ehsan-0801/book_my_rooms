"use client";

import { ActionForm } from "@/components/dashboard/action-form";
import {
  CheckboxField,
  FormActions,
  FormSection,
  FormShell,
  SelectField,
  TextField,
} from "@/components/dashboard/form";
import { updateAmenity } from "@/lib/actions/catalog";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"amenities/detail">;

export function EditAmenityClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/amenities/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditAmenityView data={data} />;
}

function EditAmenityView({ data: amenity }: { data: ViewData }) {

  return (
    <FormShell
      title={`Edit ${amenity.name}`}
      backHref="/dashboard/amenities"
      backLabel="Back to amenities"
    >
      <ActionForm action={updateAmenity} className="space-y-6">
        <input type="hidden" name="id" value={amenity.id} />
        <FormSection title="Amenity">
          <TextField label="Name" name="name" required defaultValue={amenity.name} />
          <TextField
            label="Icon"
            name="icon"
            defaultValue={amenity.icon ?? ""}
            hint="A lucide icon name. Falls back to a checkmark."
          />
          <SelectField
            label="Category"
            name="category"
            defaultValue={amenity.category ?? "general"}
            options={[
              { value: "general", label: "General" },
              { value: "room", label: "Room" },
              { value: "bathroom", label: "Bathroom" },
              { value: "food", label: "Food & drink" },
              { value: "outdoor", label: "Outdoor" },
            ]}
          />
          <CheckboxField
            label="Show as a search filter"
            name="isFilter"
            defaultChecked={amenity.isFilter}
          />
        </FormSection>
        <FormActions submitLabel="Save changes" cancelHref="/dashboard/amenities" />
      </ActionForm>
    </FormShell>
  );
}

