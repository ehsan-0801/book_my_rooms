import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  onDark = false,
  compact = false,
}: {
  className?: string;
  onDark?: boolean;
  /** Mark only, for the collapsed sidebar rail. */
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 rounded-md", className)}
      aria-label="Book My Rooms — home"
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          onDark ? "bg-white/15 backdrop-blur" : "bg-primary",
        )}
      >
        {/* Bed + roofline mark */}
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none">
          <path
            d="M3 10.5 12 4l9 6.5"
            stroke={onDark ? "white" : "var(--primary-foreground)"}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 13v6M5 15.5h14V19M19 15.5v-2a2 2 0 0 0-2-2h-4v4"
            stroke={onDark ? "white" : "var(--primary-foreground)"}
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={cn("flex-col leading-none", compact ? "hidden" : "flex")}>
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight",
            onDark ? "text-white" : "text-foreground",
          )}
        >
          Book My Rooms
        </span>
        <span
          className={cn(
            "mt-0.5 text-[10px] font-medium tracking-wide uppercase",
            onDark ? "text-white/70" : "text-muted-foreground",
          )}
        >
          Find your perfect stay
        </span>
      </span>
    </Link>
  );
}
