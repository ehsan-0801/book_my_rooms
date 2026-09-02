import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

/**
 * Storefront listing pages are statically generated with a revalidate window,
 * so a status change would otherwise stay invisible — worse, an unpublished or
 * suspended listing would remain reachable by direct URL until the window
 * expired. Anything that affects public visibility calls these so the change
 * takes effect immediately.
 */

export async function revalidateProperty(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { slug: true, district: { select: { slug: true } } },
  });
  if (!property) return;

  revalidatePath(`/properties/${property.district.slug}/${property.slug}`);
  revalidatePath(`/destinations/${property.district.slug}`);
  revalidatePath("/properties");
  revalidatePath("/offers");
  revalidatePath("/");
}

/** Suspending a vendor pulls every listing they own, so all of them refresh. */
export async function revalidateVendorProperties(vendorId: string) {
  const properties = await prisma.property.findMany({
    where: { vendorId },
    select: { slug: true, district: { select: { slug: true } } },
  });

  const districts = new Set<string>();
  for (const p of properties) {
    revalidatePath(`/properties/${p.district.slug}/${p.slug}`);
    districts.add(p.district.slug);
  }
  for (const slug of districts) revalidatePath(`/destinations/${slug}`);

  revalidatePath("/properties");
  revalidatePath("/offers");
  revalidatePath("/");
}

/** Destination copy, imagery or activation changed. */
export function revalidateDestinations(slug?: string) {
  if (slug) revalidatePath(`/destinations/${slug}`);
  revalidatePath("/destinations");
  revalidatePath("/");
}
