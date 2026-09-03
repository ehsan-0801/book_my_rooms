import { route } from "@/lib/api/handler";
import {
  getBudgetProperties,
  getDiscountedProperties,
  getFeaturedProperties,
  getNatureProperties,
  getShowcaseReviews,
  listDestinations,
  listPropertyTypes,
} from "@/lib/queries/storefront";

/** Everything the homepage renders, in one round trip. */
export const GET = route({
  roles: "public",
  handler: async () => {
    const [destinations, propertyTypes, featured, offers, budget, eco, reviews] =
      await Promise.all([
        listDestinations(),
        listPropertyTypes(),
        getFeaturedProperties(6),
        getDiscountedProperties(3),
        getBudgetProperties(3),
        getNatureProperties(3),
        getShowcaseReviews(3),
      ]);
    return { destinations, propertyTypes, featured, offers, budget, eco, reviews };
  },
});
