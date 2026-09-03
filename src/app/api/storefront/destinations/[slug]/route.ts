import { apiError, route } from "@/lib/api/handler";
import {
  getDestination,
  getPropertiesInDestination,
  listDestinations,
} from "@/lib/queries/storefront";

export const GET = route<{ slug: string }>({
  roles: "public",
  handler: async ({ params }) => {
    const destination = await getDestination(params.slug);
    if (!destination) return apiError("Destination not found", 404);

    const [properties, destinations] = await Promise.all([
      getPropertiesInDestination(destination.slug),
      listDestinations(),
    ]);
    return { destination, properties, destinations };
  },
});
