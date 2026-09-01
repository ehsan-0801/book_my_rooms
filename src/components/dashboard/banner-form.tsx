import {
  CheckboxField,
  FormActions,
  FormSection,
  SelectField,
  TextField,
} from "@/components/dashboard/form";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { Label } from "@/components/ui/label";

export interface BannerFormData {
  id?: string;
  title?: string;
  imageUrl?: string;
  linkUrl?: string | null;
  position?: string;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

const asDateInput = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export function BannerForm({
  action,
  banner,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  banner?: BannerFormData;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      {banner?.id ? <input type="hidden" name="id" value={banner.id} /> : null}

      <FormSection title="Banner">
        <TextField
          label="Title"
          name="title"
          required
          full
          defaultValue={banner?.title}
          placeholder="Cox's Bazar monsoon sale — up to 25% off"
        />
        <SelectField
          label="Placement"
          name="position"
          required
          defaultValue={banner?.position ?? "home_hero"}
          options={[
            { value: "home_hero", label: "Homepage hero" },
            { value: "home_mid", label: "Homepage mid-page" },
            { value: "search_side", label: "Search results sidebar" },
          ]}
        />
        <TextField
          label="Sort order"
          name="sortOrder"
          type="number"
          min={0}
          max={99}
          required
          defaultValue={banner?.sortOrder ?? 0}
          hint="Lower numbers show first."
        />
        <TextField
          label="Link destination"
          name="linkUrl"
          full
          defaultValue={banner?.linkUrl ?? ""}
          placeholder="/destinations/coxs-bazar"
          hint="Where the banner sends people. Relative paths are fine."
        />
        <TextField
          label="Starts"
          name="startsAt"
          type="date"
          defaultValue={asDateInput(banner?.startsAt)}
          hint="Optional — leave blank to run immediately."
        />
        <TextField
          label="Ends"
          name="endsAt"
          type="date"
          defaultValue={asDateInput(banner?.endsAt)}
        />
        <CheckboxField
          label="Active"
          name="isActive"
          defaultChecked={banner?.isActive ?? true}
        />
      </FormSection>

      <FormSection title="Artwork">
        <div className="sm:col-span-2">
          <Label className="mb-2 block">Banner image</Label>
          <ImageUploader
            kind="banners"
            max={1}
            value={
              banner?.imageUrl
                ? [{ url: banner.imageUrl, publicId: "", width: 0, height: 0 }]
                : []
            }
          />
          {/* Fallback so an existing banner keeps its image if nothing is
              re-uploaded during an edit. */}
          <input type="hidden" name="imageUrl" defaultValue={banner?.imageUrl ?? ""} />
        </div>
      </FormSection>

      <FormActions submitLabel={submitLabel} cancelHref="/dashboard/banners" />
    </form>
  );
}
