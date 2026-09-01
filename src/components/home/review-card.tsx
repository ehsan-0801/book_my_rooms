import Link from "next/link";
import { Quote } from "lucide-react";
import { RatingStars } from "@/components/property/rating-stars";

export function ReviewCard({
  review,
}: {
  review: {
    id: string;
    author: string;
    avatarInitials: string;
    rating: number;
    title: string;
    comment: string;
    date: string;
    propertyName: string;
    propertySlug: string;
    destinationSlug: string;
    district: string;
  };
}) {
  return (
    <figure className="flex h-full flex-col rounded-xl border bg-card p-5">
      <Quote className="size-6 text-primary/25" aria-hidden />
      <RatingStars rating={review.rating} className="mt-3" />
      <blockquote className="mt-3 flex-1">
        <p className="text-sm font-semibold">{review.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          &ldquo;{review.comment}&rdquo;
        </p>
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t pt-4">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
        >
          {review.avatarInitials}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">{review.author}</span>
          <span className="block truncate text-xs text-muted-foreground">
            Stayed at{" "}
            <Link
              href={`/properties/${review.destinationSlug}/${review.propertySlug}`}
              className="hover:text-foreground hover:underline"
            >
              {review.propertyName}
            </Link>
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
