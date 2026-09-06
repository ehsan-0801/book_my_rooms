"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bmr:sidebar-collapsed";

/**
 * Whether the desktop sidebar is collapsed to its icon rail.
 *
 * The choice is remembered per browser, so it survives navigation and reloads
 * rather than snapping back to wide on every page. It's read synchronously on
 * first render — this subtree only mounts after the session resolves, well
 * after hydration, so there is no server/client mismatch to flash through.
 */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // Private windows and blocked site data throw on access rather than
      // returning null; a sidebar preference isn't worth failing a render for.
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      /* preference simply won't persist */
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((prev) => !prev), []);

  return { collapsed, toggle };
}
