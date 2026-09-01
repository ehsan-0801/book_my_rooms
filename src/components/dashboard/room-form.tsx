import {
  CheckboxField,
  FormActions,
  FormSection,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/dashboard/form";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { Label } from "@/components/ui/label";
import { ActionForm } from "@/components/dashboard/action-form";
import type { ActionResult } from "@/lib/actions/result";

export interface RoomFormData {
  id?: string;
  propertyId?: string;
  name?: string;
  description?: string | null;
  bedType?: string | null;
  maxGuests?: number;
  maxAdults?: number;
  maxChildren?: number;
  sizeSqft?: number | null;
  totalUnits?: number;
  basePrice?: number;
  discountValue?: number | null;
  breakfastIncluded?: boolean;
  isRefundable?: boolean;
  isActive?: boolean;
  amenityIds?: string[];
  images?: { url: string; publicId: string; width: number; height: number }[];
}

export function RoomForm({
  action,
  room,
  properties,
  amenities,
  submitLabel,
}: {
  action: (
    prev: ActionResult | undefined,
    formData: FormData,
  ) => Promise<ActionResult>;
  room?: RoomFormData;
  properties: { id: string; name: string }[];
  amenities: { id: string; name: string }[];
  submitLabel: string;
}) {
  const selected = new Set(room?.amenityIds ?? []);

  return (
    <ActionForm action={action} className="space-y-6">
      {room?.id ? <input type="hidden" name="id" value={room.id} /> : null}

      <FormSection title="Room details">
        <SelectField
          label="Property"
          name="propertyId"
          required
          defaultValue={room?.propertyId}
          options={properties.map((p) => ({ value: p.id, label: p.name }))}
        />
        <TextField
          label="Room name"
          name="name"
          required
          defaultValue={room?.name}
          placeholder="e.g. Deluxe Sea View"
        />
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={room?.description ?? ""}
          className="min-h-24"
          placeholder="What does a guest get in this room?"
        />
        <TextField
          label="Bed configuration"
          name="bedType"
          defaultValue={room?.bedType ?? ""}
          placeholder="e.g. 1 King Bed"
        />
        <TextField
          label="Room size (sq ft)"
          name="sizeSqft"
          type="number"
          min={0}
          defaultValue={room?.sizeSqft ?? undefined}
        />
      </FormSection>

      <FormSection title="Occupancy & inventory">
        <TextField
          label="Maximum guests"
          name="maxGuests"
          type="number"
          min={1}
          max={20}
          required
          defaultValue={room?.maxGuests ?? 2}
        />
        <TextField
          label="Total rooms of this type"
          name="totalUnits"
          type="number"
          min={0}
          max={500}
          required
          defaultValue={room?.totalUnits ?? 1}
          hint="Drives real-time availability."
        />
        <TextField
          label="Maximum adults"
          name="maxAdults"
          type="number"
          min={1}
          max={20}
          required
          defaultValue={room?.maxAdults ?? 2}
        />
        <TextField
          label="Maximum children"
          name="maxChildren"
          type="number"
          min={0}
          max={10}
          required
          defaultValue={room?.maxChildren ?? 0}
        />
      </FormSection>

      <FormSection title="Pricing">
        <TextField
          label="Base price per night"
          name="basePrice"
          type="number"
          min={0}
          step={50}
          required
          defaultValue={room?.basePrice}
          hint="In BDT, before taxes."
        />
        <TextField
          label="Discount (%)"
          name="discountValue"
          type="number"
          min={0}
          max={90}
          defaultValue={room?.discountValue ?? undefined}
          hint="Leave blank for no discount."
        />
        <CheckboxField
          label="Breakfast included"
          name="breakfastIncluded"
          defaultChecked={room?.breakfastIncluded ?? false}
        />
        <CheckboxField
          label="Free cancellation available"
          name="isRefundable"
          defaultChecked={room?.isRefundable ?? true}
          hint="Uncheck for a non-refundable rate."
        />
        <CheckboxField
          label="Bookable"
          name="isActive"
          defaultChecked={room?.isActive ?? true}
          hint="Uncheck to hide this room from search without deleting it."
        />
      </FormSection>

      <FormSection title="Amenities">
        <fieldset className="sm:col-span-2">
          <legend className="sr-only">Room amenities</legend>
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

      <FormSection title="Photography">
        <div className="sm:col-span-2">
          <Label className="mb-2 block">Room images</Label>
          <ImageUploader kind="rooms" value={room?.images ?? []} max={6} />
        </div>
      </FormSection>

      <FormActions submitLabel={submitLabel} cancelHref="/dashboard/rooms" />
    </ActionForm>
  );
}
