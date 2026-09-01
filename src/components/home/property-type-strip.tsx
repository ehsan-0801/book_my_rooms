import Link from "next/link";
import * as Icons from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/amenities";

type LucideIcon = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export function PropertyTypeStrip() {
  return (
    <nav aria-label="Browse by property type">
      <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
        {PROPERTY_TYPES.map((t) => {
          const Icon = (Icons[t.icon as keyof typeof Icons] ??
            Icons.Building2) as unknown as LucideIcon;
          return (
            <li key={t.slug} className="shrink-0">
              <Link
                href={`/properties?type=${t.slug}`}
                className="flex h-full min-w-[7.5rem] flex-col items-center gap-2 rounded-xl border bg-card px-4 py-4 text-center transition-colors hover:border-primary/40 hover:bg-secondary/50"
              >
                <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-medium">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
