import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  size = 14,
  className,
  showValue = false,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}) {
  const rounded = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          width={size}
          height={size}
          className={cn(
            "shrink-0",
            i < rounded ? "fill-rating text-rating" : "fill-transparent text-muted-foreground/40",
          )}
        />
      ))}
      {showValue ? (
        <span aria-hidden className="ml-1 text-xs font-medium tabular-nums">
          {rating.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}

/** The compact score chip used on cards and the detail header. */
export function RatingBadge({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex h-7 min-w-9 items-center justify-center rounded-md bg-primary px-1.5 text-sm font-semibold tabular-nums text-primary-foreground">
        {rating.toFixed(1)}
      </span>
      {count !== undefined ? (
        <span className="text-xs text-muted-foreground">
          ({count.toLocaleString("en-BD")})
        </span>
      ) : null}
    </span>
  );
}
