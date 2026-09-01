import type { Metadata } from "next";
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
import { requireUser } from "@/lib/auth-guards";
import { createReview } from "@/lib/actions/review";
import { formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Write a review", robots: { index: false } };

export default async function NewReviewPage() {
  const user = await requireUser();

  // Only completed stays without an existing review can be reviewed.
  const eligible = await prisma.booking.findMany({
    where: { userId: user.id, status: "COMPLETED", review: { is: null } },
    orderBy: { checkOut: "desc" },
    select: {
      id: true, reference: true, checkOut: true,
      property: { select: { name: true } },
    },
  });

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
      <form action={createReview} className="space-y-6">
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
      </form>
    </FormShell>
  );
}
