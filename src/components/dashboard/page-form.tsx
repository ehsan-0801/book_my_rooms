import {
  CheckboxField,
  FormActions,
  FormSection,
  TextAreaField,
  TextField,
} from "@/components/dashboard/form";
import { ActionForm } from "@/components/dashboard/action-form";
import type { ActionResult } from "@/lib/actions/result";

export interface ContentPageFormData {
  id?: string;
  slug?: string;
  title?: string;
  body?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished?: boolean;
}

export function ContentPageForm({
  action,
  page,
  submitLabel,
}: {
  action: (
    prev: ActionResult | undefined,
    formData: FormData,
  ) => Promise<ActionResult>;
  page?: ContentPageFormData;
  submitLabel: string;
}) {
  return (
    <ActionForm action={action} className="space-y-6">
      {page?.id ? <input type="hidden" name="id" value={page.id} /> : null}

      <FormSection title="Page">
        <TextField
          label="Title"
          name="title"
          required
          defaultValue={page?.title}
          placeholder="About Book My Rooms"
        />
        <TextField
          label="URL slug"
          name="slug"
          required
          defaultValue={page?.slug}
          placeholder="about"
          className="font-mono"
          hint="Lowercase letters, numbers and hyphens. The page lives at /slug."
        />
        <TextAreaField
          label="Content"
          name="body"
          required
          defaultValue={page?.body}
          className="min-h-64"
          placeholder="Write the page content…"
        />
        <CheckboxField
          label="Published"
          name="isPublished"
          defaultChecked={page?.isPublished ?? false}
          hint="Unpublished pages are only visible here."
        />
      </FormSection>

      <FormSection title="SEO" description="Falls back to the title when left blank.">
        <TextField
          label="Meta title"
          name="metaTitle"
          defaultValue={page?.metaTitle ?? ""}
        />
        <TextAreaField
          label="Meta description"
          name="metaDescription"
          defaultValue={page?.metaDescription ?? ""}
          className="min-h-20"
          maxLength={200}
        />
      </FormSection>

      <FormActions submitLabel={submitLabel} cancelHref="/dashboard/pages" />
    </ActionForm>
  );
}
