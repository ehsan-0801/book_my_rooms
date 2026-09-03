import type { Metadata } from "next";

import { DestinationClient } from "@/components/storefront/destination-client";
import { getDestination } from "@/lib/queries/storefront";
import { bdt } from "@/lib/format";

/** Server shell — emits metadata; the body renders client-side. */
export async function generateMetadata({
  params,
}: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDestination(slug);
  if (!d) return { title: "Destination not found" };

  return {
    title: `Hotels & resorts in ${d.name}`,
    description: `${d.tagline}. Compare ${d.propertyCount} properties in ${d.name}, ${d.division} from ${bdt(d.fromPrice)} a night.`,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: { images: [{ url: d.image }] },
  };
}

export default async function DestinationPage({
  params,
}: PageProps<"/destinations/[slug]">) {
  const { slug } = await params;
  return <DestinationClient slug={slug} />;
}
