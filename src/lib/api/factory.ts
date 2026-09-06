import "server-only";

import { NextResponse } from "next/server";

import { jsonToFormData, readJsonBody } from "@/lib/api/body";
import { RESOURCES, type ResourceName } from "@/lib/api/dashboard";
import { apiError, route } from "@/lib/api/handler";
import { MUTATIONS, type MutationEntry } from "@/lib/api/mutations";
import type { Actor, Role } from "@/lib/rbac";

/**
 * Builders for the endpoint files under src/app/api/dashboard.
 *
 * Each resource gets its own named folder and route file, so a path on screen
 * maps to a file you can open. What those files must not become is 70 copies
 * of the same permission check — the check lives here, once, and the registries
 * ([dashboard.ts] for reads, [mutations.ts] for writes) stay the single place
 * that says who may call what.
 *
 * A route file is then just its own name plus which verbs it answers:
 *
 *   export const GET = readList("coupons");
 *   export const POST = create("coupons");
 */

/** A vendor awaiting approval has no vendorId to scope queries by. */
function vendorPending(actor: Actor, name: string) {
  return actor.role === "VENDOR" && !actor.vendorId && name !== "overview" && name !== "settings";
}

function mayRead(actor: Actor, name: ResourceName) {
  return (RESOURCES[name].roles as Role[]).includes(actor.role);
}

/** GET a collection, or a resource that takes no id (overview, settings). */
export function readList(name: ResourceName) {
  return route({
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    handler: async ({ actor, searchParams }) => {
      if (!mayRead(actor, name)) return apiError("You don't have permission to view that", 403);
      if (vendorPending(actor, name)) {
        return apiError("Your vendor account is still awaiting approval", 403);
      }
      return RESOURCES[name].load({ actor, searchParams });
    },
  });
}

/** GET one record — the `detail` and `form` reads, which take an id. */
export function readOne(name: ResourceName) {
  return route<{ id: string }>({
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    handler: async ({ actor, params, searchParams }) => {
      if (!mayRead(actor, name)) return apiError("You don't have permission to view that", 403);
      if (vendorPending(actor, name)) {
        return apiError("Your vendor account is still awaiting approval", 403);
      }
      return RESOURCES[name].load({ actor, searchParams, id: params.id });
    },
  });
}

/**
 * Runs a write. The role check here is a first pass that keeps a plainly
 * disallowed caller away from the action; the action itself stays the real
 * authority, because only it can check that this vendor owns this record.
 */
async function runWrite(
  entry: MutationEntry | undefined,
  actor: Actor,
  request: Request,
  extra: Record<string, unknown>,
  denial: string,
) {
  if (!entry) return apiError("That operation isn't supported here", 405);
  if (!(entry.roles as Role[]).includes(actor.role)) return apiError(denial, 403);

  const body = (await readJsonBody(request)) as Record<string, unknown>;
  const result = await entry.action(undefined, jsonToFormData({ ...body, ...extra }));

  // "warning" is a considered refusal the server is reporting on (a delete
  // blocked by active bookings), not a transport failure — so it comes back
  // 200 with the outcome in the body, the shape every form already reads.
  return NextResponse.json(result, { status: result.status === "error" ? 422 : 200 });
}

export function create(resource: keyof typeof MUTATIONS) {
  return route({
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    handler: ({ actor, request }) =>
      runWrite(MUTATIONS[resource].create, actor, request, {}, "You don't have permission to create that"),
  });
}

export function update(resource: keyof typeof MUTATIONS) {
  return route<{ id: string }>({
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    handler: ({ actor, params, request }) =>
      runWrite(MUTATIONS[resource].update, actor, request, { id: params.id }, "You don't have permission to update that"),
  });
}

export function remove(resource: keyof typeof MUTATIONS) {
  return route<{ id: string }>({
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    handler: ({ actor, params, request }) =>
      runWrite(MUTATIONS[resource].remove, actor, request, { id: params.id }, "You don't have permission to delete that"),
  });
}

/**
 * A named action on one record: POST /{resource}/{id}/{verb}.
 *
 * `idField` is the name the action reads the id under. Most take "id", but a
 * few predate this API and expect their own ("roomId"), so the URL id is
 * mapped onto whatever the action actually asks for rather than making every
 * caller know the difference.
 */
export function verb(resource: keyof typeof MUTATIONS, name: string, idField = "id") {
  return route<{ id: string }>({
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    handler: ({ actor, params, request }) =>
      runWrite(MUTATIONS[resource].verbs?.[name], actor, request, { [idField]: params.id }, "You don't have permission to do that"),
  });
}

/** A named action whose target is a body field rather than a URL id. */
export function verbNoId(resource: keyof typeof MUTATIONS, name: string) {
  return route({
    roles: ["ADMIN", "VENDOR", "CUSTOMER"],
    handler: ({ actor, request }) =>
      runWrite(MUTATIONS[resource].verbs?.[name], actor, request, {}, "You don't have permission to do that"),
  });
}
