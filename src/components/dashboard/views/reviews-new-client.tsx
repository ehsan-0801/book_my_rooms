"use client";

import Link from "next/link";

import {
  FormActions,
  FormSection,
  FormShell,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/dashboard/form";
import { EmptyState } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/dashboard/action-form";
import { createReview } from "@/lib/actions/review";
import { formatDateLong } from "@/lib/format";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"reviews">;

export function NewReviewClient() {
  const { data, loading, error } = useApi<ViewData>("/api/dashboard/reviews");

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <NewReviewView data={data} />;
}

function NewReviewView({ data }: { data: ViewData }) {
  const eligible = data.reviewable;

  if (eligible.length === 0) {
    return (
      <EmptyState
        icon="MessageSquareText"
        title="Nothing to review yet"
        body="You can review a property once your stay is complete. Reviews are limited to stays you actually booked."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/bookings">View my bookings</Link>
          </Button>
        }
      />
    );
  }

  return (
    <FormShell
      title="Write a review"
      description="Your review is checked by our team before it appears publicly."
      backHref="/dashboard/reviews"
      backLabel="Back to reviews"
    >
      <ActionForm action={createReview} className="space-y-6">
        <FormSection title="Your stay">
          <SelectField
            label="Which stay?"
            name="bookingId"
            required
            full
            options={eligible.map((b) => ({
              value: b.id,
              label: `${b.property.name} — ${formatDateLong(b.checkOut)} (${b.reference})`,
            }))}
          />
          <SelectField
            label="Rating"
            name="rating"
            required
            defaultValue="5"
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
            placeholder="Sum it up in a few words"
          />
          <TextAreaField
            label="Your review"
            name="comment"
            required
            minLength={10}
            maxLength={2000}
            className="min-h-32"
            placeholder="What would you tell a friend about this place?"
          />
        </FormSection>
        <FormActions submitLabel="Submit review" cancelHref="/dashboard/reviews" />
      </ActionForm>
    </FormShell>
  );
}

