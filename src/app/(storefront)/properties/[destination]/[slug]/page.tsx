import type { Metadata } from "next";

import { PropertyDetailClient } from "@/components/storefront/property-detail-client";
import { getPropertyBySlug } from "@/lib/queries/storefront";

/**
 * Server shell.
 *
 * The body renders client-side, but metadata is generated here: a client module
 * cannot export it, and without this every listing would lose its title,
 * description and Open Graph tags.
 */
export async function generateMetadata({
  params,
}: PageProps<"/properties/[destination]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return { title: "Property not found" };

  return {
    title: `${property.name}, ${property.district}`,
    description: property.shortDescription,
    alternates: {
      canonical: `/properties/${property.destinationSlug}/${property.slug}`,
    },
    openGraph: {
      title: property.name,
      description: property.shortDescription,
      images: [{ url: property.images[0].url }],
    },
  };
}

export default async function PropertyPage({
  params,
}: PageProps<"/properties/[destination]/[slug]">) {
  const { slug } = await params;
  return <PropertyDetailClient slug={slug} />;
}
