import * as Icons from "lucide-react";
import { amenityIcon, amenityName } from "@/lib/amenities";
import { cn } from "@/lib/utils";

type LucideIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/** Resolves an amenity slug to its lucide glyph, falling back to a check. */
export function AmenityIcon({ slug, className }: { slug: string; className?: string }) {
  const name = amenityIcon(slug) as keyof typeof Icons;
  const Icon = (Icons[name] ?? Icons.Check) as unknown as LucideIcon;
  return <Icon aria-hidden className={cn("size-4 shrink-0", className)} />;
}

export function AmenityChip({ slug }: { slug: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      <AmenityIcon slug={slug} className="size-3.5" />
      {amenityName(slug)}
    </span>
  );
}
