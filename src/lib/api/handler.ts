import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getActor, type Actor, type Role } from "@/lib/rbac";

/**
 * Single entry point for every API route.
 *
 * Moving the app to client-side rendering means authorization can no longer
 * live in the page — a browser can call any endpoint directly. Every route is
 * therefore declared with the roles it allows and goes through this wrapper,
 * so there is exactly one place where "may this caller do this" is decided.
 *
 * `roles: "public"` must be stated explicitly; omitting it is not a way to get
 * an open endpoint.
 */
export type RouteRoles = Role[] | "public";

type RouteParams = Record<string, string | string[]>;

export interface RouteContext<P extends RouteParams = RouteParams> {
  actor: Actor | null;
  params: P;
  request: Request;
  searchParams: URLSearchParams;
}

/** Authenticated routes receive a non-null actor. */
export interface AuthedRouteContext<P extends RouteParams = RouteParams>
  extends RouteContext<P> {
  actor: Actor;
}

export function apiError(message: string, status = 400, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

type Handler<P extends RouteParams> = (ctx: RouteContext<P>) => Promise<unknown>;
type AuthedHandler<P extends RouteParams> = (
  ctx: AuthedRouteContext<P>,
) => Promise<unknown>;

export function route<P extends RouteParams = RouteParams>(
  config: { roles: "public"; handler: Handler<P> },
): (request: Request, segment: { params: Promise<P> }) => Promise<Response>;
export function route<P extends RouteParams = RouteParams>(
  config: { roles: Role[]; handler: AuthedHandler<P> },
): (request: Request, segment: { params: Promise<P> }) => Promise<Response>;

export function route<P extends RouteParams = RouteParams>({
  roles,
  handler,
}: {
  roles: RouteRoles;
  handler: Handler<P> | AuthedHandler<P>;
}) {
  return async function handle(
    request: Request,
    segment: { params: Promise<P> },
  ): Promise<Response> {
    try {
      const actor = await getActor();

      if (roles !== "public") {
        if (!actor) return apiError("You need to be signed in", 401);
        if (!roles.includes(actor.role)) {
          return apiError("You don't have permission to do that", 403);
        }
      }

      const params = ((await segment?.params) ?? {}) as P;
      const searchParams = new URL(request.url).searchParams;

      const data = await (handler as Handler<P>)({
        actor,
        params,
        request,
        searchParams,
      });

      // A handler may return its own Response for streaming or redirects.
      if (data instanceof Response) return data;
      return NextResponse.json(data ?? null);
    } catch (error) {
      if (error instanceof ZodError) {
        return apiError("Check the submitted values", 422, {
          fieldErrors: error.flatten().fieldErrors,
        });
      }

      const message =
        error instanceof Error ? error.message : "Something went wrong";

      // rbac throws these; map them to real status codes rather than 500.
      if (/permission|forbidden/i.test(message)) return apiError(message, 403);
      if (/signed in|unauthorised/i.test(message)) return apiError(message, 401);
      if (/not found|no longer exists/i.test(message)) return apiError(message, 404);

      console.error("[api]", message);
      return apiError(message, 500);
    }
  };
}
