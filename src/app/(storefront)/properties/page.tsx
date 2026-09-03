import type { Metadata } from "next";
import { Suspense } from "react";

import { SearchClient } from "@/components/storefront/search-client";
import { RowListSkeleton } from "@/components/storefront/skeletons";

export const metadata: Metadata = {
  title: "Search stays",
  description:
    "Search hotels, resorts, cottages, villas, homestays and eco-resorts across Bangladesh with live availability.",
};

/** Server shell: emits metadata, which a "use client" module cannot export. */
export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <RowListSkeleton count={4} />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
