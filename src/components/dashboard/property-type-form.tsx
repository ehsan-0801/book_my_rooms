import {
  CheckboxField,
  FormActions,
  FormSection,
  TextField,
} from "@/components/dashboard/form";
import { ActionForm } from "@/components/dashboard/action-form";
import type { ActionResult } from "@/lib/actions/result";

export interface PropertyTypeFormData {
  id?: string;
  name?: string;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export function PropertyTypeForm({
  action,
  type,
  submitLabel,
}: {
  action: (
    prev: ActionResult | undefined,
    formData: FormData,
  ) => Promise<ActionResult>;
  type?: PropertyTypeFormData;
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} className="space-y-6">
      {type?.id ? <input type="hidden" name="id" value={type.id} /> : null}
      <FormSection title="Property type">
        <TextField
          label="Name"
          name="name"
          required
          defaultValue={type?.name}
          placeholder="e.g. Houseboat"
          hint="The URL slug is generated from this."
        />
        <TextField
          label="Icon"
          name="icon"
          defaultValue={type?.icon ?? ""}
          placeholder="Sailboat"
          hint="A lucide icon name. Falls back to a generic building."
        />
        <TextField
          label="Sort order"
          name="sortOrder"
          type="number"
          min={0}
          max={99}
          required
          defaultValue={type?.sortOrder ?? 0}
          hint="Lower numbers appear first in search filters."
        />
        <CheckboxField
          label="Active"
          name="isActive"
          defaultChecked={type?.isActive ?? true}
          hint="Inactive types are hidden from search and new listings."
        />
      </FormSection>
      <FormActions submitLabel={submitLabel} cancelHref="/dashboard/property-types" />
    </ActionForm>
  );
}
