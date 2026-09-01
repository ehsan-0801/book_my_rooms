import {
  CheckboxField,
  FormActions,
  FormSection,
  SelectField,
  TextField,
} from "@/components/dashboard/form";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { Label } from "@/components/ui/label";

export interface DestinationFormData {
  id?: string;
  name?: string;
  divisionId?: string;
  tagline?: string | null;
  imageUrl?: string | null;
  isPopular?: boolean;
  isActive?: boolean;
}

export function DestinationForm({
  action,
  destination,
  divisions,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  destination?: DestinationFormData;
  divisions: { id: string; name: string }[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      {destination?.id ? (
        <input type="hidden" name="id" value={destination.id} />
      ) : null}

      <FormSection title="Destination">
        <TextField
          label="Name"
          name="name"
          required
          defaultValue={destination?.name}
          placeholder="e.g. Cox's Bazar"
          hint="The URL slug is generated from this."
        />
        <SelectField
          label="Division"
          name="divisionId"
          required
          defaultValue={destination?.divisionId}
          options={divisions.map((d) => ({ value: d.id, label: d.name }))}
        />
        <TextField
          label="Tagline"
          name="tagline"
          full
          maxLength={120}
          defaultValue={destination?.tagline ?? ""}
          placeholder="The world's longest natural sea beach"
        />
        <CheckboxField
          label="Show on the homepage"
          name="isPopular"
          defaultChecked={destination?.isPopular ?? false}
        />
        <CheckboxField
          label="Active"
          name="isActive"
          defaultChecked={destination?.isActive ?? true}
          hint="Inactive destinations disappear from search and the homepage."
        />
      </FormSection>

      <FormSection title="Cover image">
        <div className="sm:col-span-2">
          <Label className="mb-2 block">Destination photo</Label>
          <ImageUploader
            kind="properties"
            max={1}
            value={
              destination?.imageUrl
                ? [{ url: destination.imageUrl, publicId: "", width: 0, height: 0 }]
                : []
            }
          />
          <input
            type="hidden"
            name="imageUrl"
            defaultValue={destination?.imageUrl ?? ""}
          />
        </div>
      </FormSection>

      <FormActions submitLabel={submitLabel} cancelHref="/dashboard/destinations" />
    </form>
  );
}
