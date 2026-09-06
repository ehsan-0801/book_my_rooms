"use client";

import { createContext, useContext, useMemo, useRef } from "react";

/**
 * Lets a form defer its uploads until the moment it is actually submitted.
 *
 * An uploader registers a `flush` here; the enclosing ActionForm runs every
 * registered flush before calling the server action, and writes what comes
 * back onto the FormData. Until the user commits, a chosen file is nothing but
 * a local preview — nothing has been sent anywhere, so abandoning a half-filled
 * form leaves no orphaned images behind.
 */
export type UploadFlush = () => Promise<{ name: string; value: string }>;

export interface UploadQueue {
  register: (flush: UploadFlush) => () => void;
  flushAll: () => Promise<{ name: string; value: string }[]>;
}

const UploadQueueContext = createContext<UploadQueue | null>(null);

/** Creates the queue an ActionForm owns and provides to its children. */
export function useUploadQueueValue(): UploadQueue {
  const flushes = useRef<Set<UploadFlush>>(new Set());

  return useMemo(
    () => ({
      register(flush) {
        flushes.current.add(flush);
        return () => {
          flushes.current.delete(flush);
        };
      },
      // Uploads run together rather than one after another: a room form with
      // six new photos would otherwise serialise six round trips.
      flushAll: () => Promise.all([...flushes.current].map((flush) => flush())),
    }),
    [],
  );
}

export function UploadQueueProvider({
  value,
  children,
}: {
  value: UploadQueue;
  children: React.ReactNode;
}) {
  return <UploadQueueContext.Provider value={value}>{children}</UploadQueueContext.Provider>;
}

/** Null when an uploader is used outside a form — it then uploads on its own. */
export function useUploadQueue() {
  return useContext(UploadQueueContext);
}
