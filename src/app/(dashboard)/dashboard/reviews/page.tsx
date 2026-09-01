import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { RatingStars } from "@/components/property/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { requireUser } from "@/lib/auth-guards";
import { formatDateLong } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { moderateReview } from "@/lib/actions/admin";
import { replyToReview } from "@/lib/actions/vendor";
import { deleteReview } from "@/lib/actions/review";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Reviews", robots: { index: false } };

export default async function ReviewsPage({
  searchParams,
}: PageProps<"/dashboard/reviews">) {
  const user = await requireUser();
  const sp = await searchParams;
  const filter = (Array.isArray(sp.status) ? sp.status[0] : sp.status) ?? "all";

  const scope: Prisma.ReviewWhereInput =
    user.role === "ADMIN"
      ? {}
      : user.role === "VENDOR"
        ? { property: { vendorId: user.vendorId ?? "__none__" } }
        : { userId: user.id };

  const reviews = await prisma.review.findMany({
    where: {
      ...scope,
      ...(filter === "pending" ? { isApproved: false } : {}),
      ...(filter === "approved" ? { isApproved: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true, rating: true, title: true, comment: true, isApproved: true,
      vendorReply: true, createdAt: true,
      user: { select: { name: true } },
      property: { select: { name: true, slug: true, district: { select: { slug: true } } } },
      booking: { select: { reference: true } },
    },
  });

  const isCustomer = user.role === "CUSTOMER";
  const isAdmin = user.role === "ADMIN";
  const isVendor = user.role === "VENDOR";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCustomer ? "My reviews" : "Reviews"}
        description={
          isCustomer
            ? "Reviews you've written. Edits go back through moderation."
            : isVendor
              ? "What guests are saying, and your replies."
              : "Approve or remove guest reviews. Unapproved reviews stay hidden."
        }
        action={
          isCustomer ? (
            <Button asChild>
              <Link href="/dashboard/reviews/new">
                <Plus aria-hidden />
                Write a review
              </Link>
            </Button>
          ) : undefined
        }
      />

      {!isCustomer ? (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Awaiting moderation" },
            { value: "approved", label: "Published" },
          ].map((f) => (
            <Button
              key={f.value}
              asChild
              size="sm"
              className="shrink-0"
              variant={filter === f.value ? "default" : "outline"}
            >
              <Link
                href={
                  f.value === "all"
                    ? "/dashboard/reviews"
                    : `/dashboard/reviews?status=${f.value}`
                }
              >
                {f.label}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <EmptyState
          icon="MessageSquareText"
          title="No reviews here"
          body={
            isCustomer
              ? "After you complete a stay you can write a review of it."
              : "Nothing matches this filter."
          }
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/properties/${r.property.district.slug}/${r.property.slug}`}
                    target="_blank"
                    className="font-medium hover:underline"
                  >
                    {r.property.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isCustomer ? "Your review" : r.user.name} ·{" "}
                    {formatDateLong(r.createdAt)} · {r.booking.reference}
                  </p>
                </div>
                <Badge
                  className={
                    r.isApproved
                      ? "bg-success text-white"
                      : "bg-warning text-white"
                  }
                >
                  {r.isApproved ? "Published" : "Awaiting moderation"}
                </Badge>
              </div>

              <RatingStars rating={r.rating} className="mt-3" showValue />
              {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
              {r.comment ? (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {r.comment}
                </p>
              ) : null}

              {r.vendorReply ? (
                <div className="mt-3 rounded-lg border-l-2 border-primary bg-secondary/40 p-3">
                  <p className="text-xs font-semibold">Reply from the property</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.vendorReply}</p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
                {isAdmin ? (
                  <ActionForm action={moderateReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      type="hidden"
                      name="approve"
                      value={r.isApproved ? "false" : "true"}
                    />
                    <SubmitButton size="sm" variant={r.isApproved ? "outline" : "default"}>
                      {r.isApproved ? "Unpublish" : "Approve"}
                    </SubmitButton>
                  </ActionForm>
                ) : null}

                {isCustomer ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/reviews/${r.id}/edit`}>
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </Link>
                  </Button>
                ) : null}

                {isAdmin || isCustomer ? (
                  <DeleteDialog
                    action={deleteReview}
                    id={r.id}
                    title="Delete this review"
                    description="The review is removed and the property's rating is recalculated."
                  />
                ) : null}
              </div>

              {isVendor && !r.vendorReply ? (
                <ActionForm action={replyToReview} className="mt-4 border-t pt-4">
                  <input type="hidden" name="id" value={r.id} />
                  <label htmlFor={`reply-${r.id}`} className="text-sm font-medium">
                    Reply publicly
                  </label>
                  <Textarea
                    id={`reply-${r.id}`}
                    name="reply"
                    required
                    minLength={2}
                    className="mt-1.5 min-h-20"
                    placeholder="Thank the guest, or address what they raised."
                  />
                  <div className="mt-2 flex justify-end">
                    <SubmitButton size="sm">Post reply</SubmitButton>
                  </div>
                </ActionForm>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
