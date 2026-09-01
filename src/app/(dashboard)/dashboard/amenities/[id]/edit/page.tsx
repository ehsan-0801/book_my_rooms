import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/dashboard/action-form";
import {
  CheckboxField,
  FormActions,
  FormSection,
  FormShell,
  SelectField,
  TextField,
} from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { updateAmenity } from "@/lib/actions/catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit amenity", robots: { index: false } };

export default async function EditAmenityPage({
  params,
}: PageProps<"/dashboard/amenities/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const amenity = await prisma.amenity.findUnique({ where: { id } });
  if (!amenity) notFound();

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
