import { NextResponse } from "next/server";

import { RESOURCES, isResource } from "@/lib/api/dashboard";
import { apiError, route } from "@/lib/api/handler";
import { jsonToFormData, readJsonBody } from "@/lib/api/body";
import { MUTATIONS, isMutationResource, type MutationEntry } from "@/lib/api/mutations";
import type { Actor, Role } from "@/lib/rbac";

/**
 * The whole application's dashboard API: every read and every write, under
 * one namespace.
 *
 * Reads  — GET    /api/dashboard/{resource}[/{id}]
 * Writes — POST   /api/dashboard/{resource}                create
 *          PATCH  /api/dashboard/{resource}/{id}           update
 *          DELETE /api/dashboard/{resource}/{id}           remove
 *          POST   /api/dashboard/{resource}/{id}/{verb}    a named action on one record
 *          POST   /api/dashboard/{resource}/{verb}         a named action with no URL id
 *                                                           (its target, e.g. propertyId,
 *                                                           is a field in the body instead)
 *
 * `roles` on each entry lets this dispatcher reject with 401/403 before
 * calling anything; the action behind it remains the real authority — it is
 * the same function a dashboard form already calls, so a vendor's id-scoped
 * ownership check still runs no matter which door the request came through.
 */

function checkRole(actor: Actor, entry: MutationEntry) {
  return (entry.roles as Role[]).includes(actor.role);
}

async function runMutation(entry: MutationEntry, request: Request, extra: Record<string, unknown>) {
  const raw = (await readJsonBody(request)) as Record<string, unknown>;
  const formData = jsonToFormData({ ...raw, ...extra });
  const result = await entry.action(undefined, formData);

  // Dispatcher-level role/ownership failures are hard 401/403s. Once inside
  // an action, "warning" and "success" are both legitimate outcomes the
  // server processed and is reporting on — a refused delete because of active
  // bookings is not a transport failure — so both return 200 with the result
  // in the body, the same shape every ActionForm in the app already reads.
  // "error" covers validation and unexpected failures.
  const status = result.status === "error" ? 422 : 200;
  return NextResponse.json(result, { status });
}

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

export const POST = route<{ segments: string[] }>({
  roles: ["ADMIN", "VENDOR", "CUSTOMER"],
  handler: async ({ actor, params, request }) => {
    const segments = params.segments ?? [];
    const [resourceName, a, b] = segments;
    if (!resourceName || !isMutationResource(resourceName)) {
      return apiError(`Unknown resource: ${resourceName ?? ""}`, 404);
    }
    const resource = MUTATIONS[resourceName];

    // POST /{resource}                — create
    if (a === undefined) {
      if (!resource.create) return apiError(`${resourceName} has no create operation`, 405);
      if (!checkRole(actor, resource.create)) {
        return apiError("You don't have permission to create that", 403);
      }
      return runMutation(resource.create, request, {});
    }

    // POST /{resource}/{verb}         — a verb with no URL id
    if (b === undefined) {
      const entry = resource.verbs?.[a];
      if (!entry) return apiError(`Unknown action: ${resourceName}/${a}`, 404);
      if (!checkRole(actor, entry)) {
        return apiError("You don't have permission to do that", 403);
      }
      return runMutation(entry, request, {});
    }

    // POST /{resource}/{id}/{verb}    — a verb scoped to one record
    const entry = resource.verbs?.[b];
    if (!entry) return apiError(`Unknown action: ${resourceName}/${b}`, 404);
    if (!checkRole(actor, entry)) {
      return apiError("You don't have permission to do that", 403);
    }
    return runMutation(entry, request, { id: a });
  },
});

export const PATCH = route<{ segments: string[] }>({
  roles: ["ADMIN", "VENDOR", "CUSTOMER"],
  handler: async ({ actor, params, request }) => {
    const [resourceName, id] = params.segments ?? [];
    if (!resourceName || !isMutationResource(resourceName)) {
      return apiError(`Unknown resource: ${resourceName ?? ""}`, 404);
    }
    if (!id) return apiError("An id is required to update a record", 400);

    const resource = MUTATIONS[resourceName];
    if (!resource.update) return apiError(`${resourceName} has no update operation`, 405);
    if (!checkRole(actor, resource.update)) {
      return apiError("You don't have permission to update that", 403);
    }
    return runMutation(resource.update, request, { id });
  },
});

export const DELETE = route<{ segments: string[] }>({
  roles: ["ADMIN", "VENDOR", "CUSTOMER"],
  handler: async ({ actor, params, request }) => {
    const [resourceName, id] = params.segments ?? [];
    if (!resourceName || !isMutationResource(resourceName)) {
      return apiError(`Unknown resource: ${resourceName ?? ""}`, 404);
    }
    if (!id) return apiError("An id is required to delete a record", 400);

    const resource = MUTATIONS[resourceName];
    if (!resource.remove) return apiError(`${resourceName} has no delete operation`, 405);
    if (!checkRole(actor, resource.remove)) {
      return apiError("You don't have permission to delete that", 403);
    }
    return runMutation(resource.remove, request, { id });
  },
});
