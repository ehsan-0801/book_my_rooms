"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { progress } from "@/lib/progress";

/** Shape returned by `route()` when a handler fails. */
interface ApiErrorBody {
  error: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[] | undefined>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = body.fieldErrors;
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, credentials: "same-origin" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as ApiErrorBody;
    throw new ApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}

export interface QueryState<T> {
  data: T | undefined;
  error: ApiError | undefined;
  loading: boolean;
  /** Refetches without clearing the current data, so the UI doesn't flash. */
  refresh: () => void;
}

/**
 * Data fetching for client pages.
 *
 * Deliberately small rather than pulling in a cache library: pages here fetch
 * one endpoint and re-fetch after a mutation. `loading` is true only on the
 * first load so a refresh keeps showing the previous data instead of dropping
 * back to a skeleton.
 */
export function useApi<T>(path: string | null): QueryState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError>();
  const [settled, setSettled] = useState(false);
  const [nonce, setNonce] = useState(0);
  const seenOnce = useRef(false);

  // Derived rather than stored: a null path means there is nothing to wait for,
  // so `loading` follows from the inputs instead of being synced in an effect.
  const loading = Boolean(path) && !settled;

  useEffect(() => {
    if (!path) return;

    const controller = new AbortController();
    let cancelled = false;

    progress.start();

    apiGet<T>(path, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(undefined);
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) return;
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError(0, { error: "Could not reach the server" });
        setError(apiError);
        // 401/403 are handled by the page (sign-in prompt); anything else is
        // worth surfacing immediately.
        if (apiError.status !== 401 && apiError.status !== 403) {
          toast.error(apiError.message);
        }
      })
      .finally(() => {
        if (cancelled) return;
        seenOnce.current = true;
        setSettled(true);
        progress.done();
      });

    return () => {
      cancelled = true;
      controller.abort();
      progress.done();
    };
  }, [path, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { data, error, loading, refresh };
}
