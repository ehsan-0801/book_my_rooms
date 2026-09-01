"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "@/components/ui/sonner";

/*
  Toast placement follows the thumb: bottom-right on desktop, where it sits
  clear of content, and top-centre on phones, where a bottom toast would land
  under the sticky action bars and the WhatsApp button.
*/
const QUERY = "(min-width: 640px)";

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => true;

export function AppToaster() {
  const isDesktop = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <Toaster
      position={isDesktop ? "bottom-right" : "top-center"}
      richColors
      closeButton
      expand
      duration={4500}
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
    />
  );
}
