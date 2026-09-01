/**
 * Every server action returns one of these instead of throwing.
 *
 * A thrown error in a server action surfaces as an error boundary, which loses
 * the message and blows away the page the user was working on. Returning a
 * result lets the caller show a toast and keep the form state intact.
 *
 * Reserve `error` for "we couldn't do it", and `warning` for "we did something,
 * but you should know" or a refusal the user can fix themselves.
 */
export type ActionStatus = "success" | "error" | "warning";

export interface ActionResult {
  status: ActionStatus;
  message: string;
  /** Client navigates here after toasting. Used by create/update flows. */
  redirectTo?: string;
  /** Per-field messages, keyed by input name. */
  fieldErrors?: Record<string, string[] | undefined>;
  /**
   * Changes identity on every dispatch so a repeated identical result still
   * fires a toast rather than being swallowed as "same state".
   */
  key: number;
}

const stamp = () => Date.now() + Math.random();

export function ok(message: string, redirectTo?: string): ActionResult {
  return { status: "success", message, redirectTo, key: stamp() };
}

export function fail(
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
): ActionResult {
  return { status: "error", message, fieldErrors, key: stamp() };
}

export function warn(message: string): ActionResult {
  return { status: "warning", message, key: stamp() };
}

/**
 * Wraps an action body so unexpected throws still reach the user as a toast.
 * Auth failures are mapped to a warning — they're a permissions problem the
 * user can act on, not a crash.
 */
export async function guard(
  fn: () => Promise<ActionResult>,
): Promise<ActionResult> {
  try {
    return await fn();
  } catch (error) {
    // `redirect()` and `notFound()` throw control-flow errors that must escape.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
        (error as { digest: string }).digest === "NEXT_NOT_FOUND")
    ) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "Something went wrong";
    const isPermission = /forbidden|permission|signed in|unauthorised/i.test(
      message,
    );
    return isPermission ? warn(message) : fail(message);
  }
}
