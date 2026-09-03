"use client";

import {
  FormActions,
  FormSection,
  FormShell,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/dashboard/form";
import { updateReview } from "@/lib/actions/review";
import { ActionForm } from "@/components/dashboard/action-form";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"reviews/detail">;

export function EditReviewClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/reviews/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditReviewView data={data} />;
}

function EditReviewView({ data: review }: { data: ViewData }) {

  return (
    <FormShell
      title={`Edit your review of ${review.property.name}`}
      description="Edited reviews go back through moderation before republishing."
      backHref="/dashboard/reviews"
      backLabel="Back to reviews"
    >
      <ActionForm action={updateReview} className="space-y-6">
        <input type="hidden" name="id" value={review.id} />
        <FormSection title="Your review">
          <SelectField
            label="Rating"
            name="rating"
            required
            defaultValue={String(review.rating)}
            options={[
              { value: "5", label: "5 — Exceptional" },
              { value: "4", label: "4 — Very good" },
              { value: "3", label: "3 — Good" },
              { value: "2", label: "2 — Poor" },
              { value: "1", label: "1 — Terrible" },
            ]}
          />
          <TextField
            label="Title"
            name="title"
            maxLength={120}
            defaultValue={review.title ?? ""}
          />
          <TextAreaField
            label="Your review"
            name="comment"
            required
            minLength={10}
            maxLength={2000}
            className="min-h-32"
            defaultValue={review.comment ?? ""}
          />
        </FormSection>
        <FormActions submitLabel="Save review" cancelHref="/dashboard/reviews" />
      </ActionForm>
    </FormShell>
  );
}

