import { RESOURCES, isResource } from "@/lib/api/dashboard";
import { apiError, route } from "@/lib/api/handler";
import type { Role } from "@/lib/rbac";

/**
 * Serves every dashboard read.
 *
 * `roles` here is only "signed in" — the per-resource roles declared in the
 * registry are the real gate, checked below before the loader runs. Keeping
 * them beside the query is what stops a client-rendered page from becoming the
 * only thing standing between a vendor and another vendor's data.
 *
 * Paths are `/api/dashboard/{resource}` or `/api/dashboard/{resource}/{id}`,
 * plus a `{resource}/detail` and `{resource}/form` convention for the pages
 * that need a different shape than the list.
 */
export const GET = route<{ segments: string[] }>({
  roles: ["ADMIN", "VENDOR", "CUSTOMER"],
  handler: async ({ actor, params, searchParams }) => {
    const segments = params.segments ?? [];
    if (segments.length === 0) return apiError("No resource given", 400);

    // "vendors/detail/abc123" -> resource "vendors/detail", id "abc123"
    let name = segments[0];
    let id: string | undefined;

    if (segments.length >= 2) {
      const maybeQualified = `${segments[0]}/${segments[1]}`;
      if (isResource(maybeQualified)) {
        name = maybeQualified;
        id = segments[2];
      } else {
        id = segments[1];
      }
    }

    if (!isResource(name)) return apiError(`Unknown resource: ${name}`, 404);

    const resource = RESOURCES[name];
    // `satisfies` narrows each entry's roles to a literal tuple; widen to
    // compare against the caller's role.
    if (!(resource.roles as Role[]).includes(actor.role)) {
      return apiError("You don't have permission to view that", 403);
    }

    // A vendor whose account is still pending has no vendorId to scope by.
    if (actor.role === "VENDOR" && !actor.vendorId && name !== "overview" && name !== "settings") {
      return apiError("Your vendor account is still awaiting approval", 403);
    }

    return resource.load({ actor, searchParams, id });
  },
});
