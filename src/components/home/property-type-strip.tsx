import Link from "next/link";
import { AmenityIcon } from "@/components/property/amenity-icon";

export interface PropertyTypeOption {
  slug: string;
  name: string;
  icon: string | null;
}

export function PropertyTypeStrip({ types }: { types: PropertyTypeOption[] }) {
  if (types.length === 0) return null;

  return (
    <nav aria-label="Browse by property type">
      <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
        {types.map((type) => (
          <li key={type.slug} className="shrink-0">
            <Link
              href={`/properties?type=${type.slug}`}
              className="flex h-full min-w-[7.5rem] flex-col items-center gap-2 rounded-xl border bg-card px-4 py-4 text-center transition-colors hover:border-primary/40 hover:bg-secondary/50"
            >
              <span className="grid size-10 place-items-center rounded-full bg-secondary text-primary">
                <AmenityIcon icon={type.icon} className="size-5" />
              </span>
              <span className="text-sm font-medium">{type.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
