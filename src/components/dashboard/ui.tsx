import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LucideIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  delta,
  hint,
  href,
}: {
  label: string;
  value: string;
  icon: string;
  /** Percent change vs. the previous period. */
  delta?: number;
  hint?: string;
  href?: string;
}) {
  const Icon = (Icons[icon as keyof typeof Icons] ?? Icons.Circle) as unknown as LucideIcon;
  const up = (delta ?? 0) >= 0;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
      {delta !== undefined ? (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            up ? "text-success" : "text-destructive",
          )}
        >
          {up ? (
            <ArrowUpRight className="size-3.5" aria-hidden />
          ) : (
            <ArrowDownRight className="size-3.5" aria-hidden />
          )}
          {up ? "+" : ""}
          {delta}% vs last 30 days
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </>
  );

  const className =
    "rounded-xl border bg-card p-4 transition-shadow" + (href ? " hover:shadow-md" : "");

  return href ? (
    <Link href={href} className={cn(className, "block")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** Consistent colouring for every status enum surfaced in the panels. */
const STATUS_TONE: Record<string, string> = {
  // booking
  CONFIRMED: "bg-success text-white",
  COMPLETED: "bg-secondary text-secondary-foreground",
  PENDING: "bg-warning text-white",
  PAYMENT_PENDING: "bg-warning text-white",
  CANCELLED: "bg-destructive text-white",
  REJECTED: "bg-destructive text-white",
  FAILED: "bg-destructive text-white",
  REFUND_PENDING: "bg-warning text-white",
  REFUNDED: "bg-secondary text-secondary-foreground",
  // payment
  PAID: "bg-success text-white",
  UNPAID: "bg-muted text-muted-foreground",
  PROCESSING: "bg-warning text-white",
  PARTIALLY_REFUNDED: "bg-secondary text-secondary-foreground",
  // vendor / property
  APPROVED: "bg-success text-white",
  SUSPENDED: "bg-destructive text-white",
  PUBLISHED: "bg-success text-white",
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_REVIEW: "bg-warning text-white",
  UNPUBLISHED: "bg-muted text-muted-foreground",
  // commission / payout
  EARNED: "bg-success text-white",
  SETTLED: "bg-primary text-primary-foreground",
  REVERSED: "bg-destructive text-white",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
  return (
    <Badge className={cn("whitespace-nowrap", STATUS_TONE[status] ?? "bg-secondary text-secondary-foreground")}>
      {label}
    </Badge>
  );
}

/**
 * Tables are the natural shape for this data on a desktop, but they scroll
 * badly on a phone. Every table sits in this wrapper so the page body never
 * scrolls sideways — only the table does.
 */
export function TableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon = "Inbox",
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  const Icon = (Icons[icon as keyof typeof Icons] ?? Icons.Inbox) as unknown as LucideIcon;
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {body ? <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
