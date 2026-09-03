import { route } from "@/lib/api/handler";
import { listDestinations } from "@/lib/queries/storefront";

export const GET = route({
  roles: "public",
  handler: async ({ searchParams }) =>
    listDestinations(searchParams.get("popular") === "true"),
});
