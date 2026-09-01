import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  FormActions,
  FormSection,
  FormShell,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/dashboard/form";
import { requireUser } from "@/lib/auth-guards";
import { updateReview } from "@/lib/actions/review";
import { prisma } from "@/lib/prisma";
import { ActionForm } from "@/components/dashboard/action-form";

export const metadata: Metadata = { title: "Edit review", robots: { index: false } };

export default async function EditReviewPage({
  params,
}: PageProps<"/dashboard/reviews/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;

  const review = await prisma.review.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true, rating: true, title: true, comment: true,
      property: { select: { name: true } },
    },
  });
  if (!review) notFound();

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
