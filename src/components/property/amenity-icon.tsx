import * as Icons from "lucide-react";
import type { AmenityRef } from "@/lib/types";
import { cn } from "@/lib/utils";

type LucideIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/**
 * Resolves an amenity's lucide glyph by name, falling back to a check.
 *
 * The icon travels with the amenity record rather than being looked up from a
 * hardcoded table, because admins can add amenities at runtime.
 */
export function AmenityIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const Icon = (Icons[(icon ?? "") as keyof typeof Icons] ??
    Icons.Check) as unknown as LucideIcon;
  return <Icon aria-hidden className={cn("size-4 shrink-0", className)} />;
}

export function AmenityChip({ amenity }: { amenity: AmenityRef }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      <AmenityIcon icon={amenity.icon} className="size-3.5" />
      {amenity.name}
    </span>
  );
}

/** Inline icon + label, used in cards and lists. */
export function AmenityItem({
  amenity,
  className,
}: {
  amenity: AmenityRef;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <AmenityIcon icon={amenity.icon} className="size-3.5" />
      {amenity.name}
    </span>
  );
}
