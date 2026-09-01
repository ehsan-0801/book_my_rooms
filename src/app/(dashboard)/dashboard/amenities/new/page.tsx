import type { Metadata } from "next";

import {
  CheckboxField,
  FormActions,
  FormSection,
  FormShell,
  SelectField,
  TextField,
} from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { createAmenity } from "@/lib/actions/catalog";
import { ActionForm } from "@/components/dashboard/action-form";

export const metadata: Metadata = { title: "New amenity", robots: { index: false } };

export default async function NewAmenityPage() {
  await requireAdmin();
  return (
    <FormShell
      title="New amenity"
      description="Amenities are shared across every property and room."
      backHref="/dashboard/amenities"
      backLabel="Back to amenities"
    >
      <ActionForm action={createAmenity} className="space-y-6">
        <FormSection title="Amenity">
          <TextField
            label="Name"
            name="name"
            required
            defaultValue=""
            placeholder="e.g. Rooftop Pool"
          />
          <TextField
            label="Icon"
            name="icon"
            placeholder="Waves"
            hint="A lucide icon name. Falls back to a checkmark."
          />
          <SelectField
            label="Category"
            name="category"
            defaultValue="general"
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
            hint="Filterable amenities appear as checkboxes on the search page."
          />
        </FormSection>
        <FormActions submitLabel="Create amenity" cancelHref="/dashboard/amenities" />
      </ActionForm>
    </FormShell>
  );
}
