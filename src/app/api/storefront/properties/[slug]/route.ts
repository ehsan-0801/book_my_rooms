import { apiError, route } from "@/lib/api/handler";
import { getDestination, getPropertyBySlug } from "@/lib/queries/storefront";

export const GET = route<{ slug: string }>({
  roles: "public",
  handler: async ({ params }) => {
    // getPropertyBySlug already restricts to published listings from approved
    // vendors, so an unpublished slug is indistinguishable from a missing one.
    const property = await getPropertyBySlug(params.slug);
    if (!property) return apiError("Property not found", 404);

    const destination = await getDestination(property.destinationSlug);
    return { property, destination };
  },
});
