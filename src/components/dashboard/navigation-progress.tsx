"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { progress } from "@/lib/progress";

const subscribe = (cb: () => void) => progress.subscribe(cb);
const getSnapshot = () => progress.get();
const getServerSnapshot = () => 0;

/**
 * The activity bar that sits directly under the navbar.
 *
 * App Router exposes no router events, so navigation is detected from both
 * ends: a delegated click on any internal link starts the bar, and the
 * pathname actually changing finishes it. Server actions drive the same store
 * via `ActionForm`, so the bar covers saves as well as page moves.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Start on any same-origin link click that will actually navigate.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page — nothing will change, so nothing to report.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      progress.start();
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // The new route has rendered — finish whatever the click started.
  useEffect(() => {
    progress.reset();
  }, [pathname, searchParams]);

  const visible = value > 0;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-full h-0.5 overflow-hidden"
    >
      <div
        className="h-full bg-primary transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${value}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
