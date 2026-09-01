import {
  FormActions,
  FormSection,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/dashboard/form";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { Label } from "@/components/ui/label";

export interface PropertyFormData {
  id?: string;
  name?: string;
  typeId?: string;
  districtId?: string;
  areaId?: string | null;
  category?: string;
  shortDescription?: string | null;
  description?: string;
  addressLine?: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  starRating?: number | null;
  checkInTime?: string;
  checkOutTime?: string;
  latitude?: number | null;
  longitude?: number | null;
  policies?: string | null;
  rules?: string | null;
  cancellationPolicy?: string | null;
  basePrice?: number;
  amenityIds?: string[];
  images?: { url: string; publicId: string; width: number; height: number }[];
}

export function PropertyForm({
  action,
  property,
  types,
  districts,
  amenities,
  vendors,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  property?: PropertyFormData;
  types: { id: string; name: string }[];
  districts: { id: string; name: string }[];
  amenities: { id: string; name: string }[];
  /** Admins choose the owning vendor; vendors never see this. */
  vendors?: { id: string; businessName: string }[];
  submitLabel: string;
}) {
  const selected = new Set(property?.amenityIds ?? []);

  return (
    <form action={action} className="space-y-6">
      {property?.id ? <input type="hidden" name="id" value={property.id} /> : null}

      <FormSection title="Basics" description="How the property appears in search results.">
        <TextField
          label="Property name"
          name="name"
          required
          full
          defaultValue={property?.name}
          placeholder="e.g. Sea Pearl Beach Resort & Spa"
        />

        {vendors ? (
          <SelectField
            label="Owning vendor"
            name="vendorId"
            required
            options={vendors.map((v) => ({ value: v.id, label: v.businessName }))}
          />
        ) : null}

        <SelectField
          label="Property type"
          name="typeId"
          required
          defaultValue={property?.typeId}
          options={types.map((t) => ({ value: t.id, label: t.name }))}
        />
        <SelectField
          label="Category"
          name="category"
          required
          defaultValue={property?.category ?? "STANDARD"}
          options={[
            { value: "LUXURY", label: "Luxury" },
            { value: "STANDARD", label: "Standard" },
            { value: "BUDGET", label: "Budget" },
          ]}
        />
        <SelectField
          label="Destination"
          name="districtId"
          required
          defaultValue={property?.districtId}
          options={districts.map((d) => ({ value: d.id, label: d.name }))}
        />
        <TextField
          label="Star rating"
          name="starRating"
          type="number"
          min={1}
          max={5}
          defaultValue={property?.starRating ?? undefined}
          hint="Official rating, 1–5. Leave blank if unrated."
        />
        <TextField
          label="Starting price per night"
          name="basePrice"
          type="number"
          min={0}
          step={50}
          required
          defaultValue={property?.basePrice}
          hint="In BDT. Recalculated from your cheapest room."
        />

        <TextAreaField
          label="Short description"
          name="shortDescription"
          maxLength={200}
          defaultValue={property?.shortDescription ?? ""}
          placeholder="One line that sells the place — shown on search cards."
          className="min-h-16"
        />
        <TextAreaField
          label="Full description"
          name="description"
          required
          defaultValue={property?.description}
          placeholder="What makes this property worth booking?"
          className="min-h-32"
        />
      </FormSection>

      <FormSection title="Location & contact">
        <TextAreaField
          label="Address"
          name="addressLine"
          required
          defaultValue={property?.addressLine}
          className="min-h-16"
          placeholder="Street, area, district, postcode"
        />
        <TextField
          label="Latitude"
          name="latitude"
          type="number"
          step="any"
          defaultValue={property?.latitude ?? undefined}
          placeholder="21.4272"
        />
        <TextField
          label="Longitude"
          name="longitude"
          type="number"
          step="any"
          defaultValue={property?.longitude ?? undefined}
          placeholder="92.0058"
        />
        <TextField
          label="Contact phone"
          name="contactPhone"
          type="tel"
          defaultValue={property?.contactPhone ?? ""}
          placeholder="01XXXXXXXXX"
        />
        <TextField
          label="Contact email"
          name="contactEmail"
          type="email"
          defaultValue={property?.contactEmail ?? ""}
        />
        <TextField
          label="Website"
          name="website"
          type="url"
          defaultValue={property?.website ?? ""}
          placeholder="https://"
        />
      </FormSection>

      <FormSection title="Stay rules">
        <TextField
          label="Check-in time"
          name="checkInTime"
          type="time"
          required
          defaultValue={property?.checkInTime ?? "14:00"}
        />
        <TextField
          label="Check-out time"
          name="checkOutTime"
          type="time"
          required
          defaultValue={property?.checkOutTime ?? "12:00"}
        />
        <TextAreaField
          label="Policies"
          name="policies"
          defaultValue={property?.policies ?? ""}
          hint="One per line."
          className="min-h-24"
        />
        <TextAreaField
          label="House rules"
          name="rules"
          defaultValue={property?.rules ?? ""}
          hint="One per line."
          className="min-h-24"
        />
        <TextAreaField
          label="Cancellation policy"
          name="cancellationPolicy"
          defaultValue={property?.cancellationPolicy ?? ""}
          className="min-h-20"
        />
      </FormSection>

      <FormSection title="Amenities" description="These drive the search filters.">
        <fieldset className="sm:col-span-2">
          <legend className="sr-only">Amenities</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors hover:bg-secondary/40 has-checked:border-primary has-checked:bg-secondary/50"
              >
                <input
                  type="checkbox"
                  name="amenityIds"
                  value={a.id}
                  defaultChecked={selected.has(a.id)}
                  className="size-4 rounded border-input accent-primary"
                />
                {a.name}
              </label>
            ))}
          </div>
        </fieldset>
      </FormSection>

      <FormSection title="Photography" description="The first image becomes the cover.">
        <div className="sm:col-span-2">
          <Label className="mb-2 block">Property images</Label>
          <ImageUploader kind="properties" value={property?.images ?? []} max={10} />
        </div>
      </FormSection>

      <FormActions submitLabel={submitLabel} cancelHref="/dashboard/properties" />
    </form>
  );
}
