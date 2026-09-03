import { route } from "@/lib/api/handler";
import { parseSearchQuery } from "@/lib/search";
import { getFacetCounts, searchProperties } from "@/lib/queries/search";
import {
  getDestination,
  listDestinations,
  listFilterAmenities,
  listPropertyTypes,
} from "@/lib/queries/storefront";

/** Search results plus everything the filter sidebar needs. */
export const GET = route({
  roles: "public",
  handler: async ({ searchParams }) => {
    const raw = Object.fromEntries(searchParams.entries());
    const query = parseSearchQuery(raw);

    const [results, counts, types, amenities, destinations, destination] =
      await Promise.all([
        searchProperties(query),
        getFacetCounts(query),
        listPropertyTypes(),
        listFilterAmenities(),
        listDestinations(),
        query.destination ? getDestination(query.destination) : Promise.resolve(null),
      ]);

    return { ...results, counts, types, amenities, destinations, destination };
  },
});
