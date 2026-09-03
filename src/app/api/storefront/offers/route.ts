import { route } from "@/lib/api/handler";
import { getDiscountedProperties } from "@/lib/queries/storefront";

export const GET = route({
  roles: "public",
  handler: async () => ({ offers: await getDiscountedProperties() }),
});
