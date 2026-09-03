import type { Metadata } from "next";

import { RoomsClient } from "@/components/dashboard/views/rooms-client";

export const metadata: Metadata = { title: "Rooms & rates", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function RoomsPage() {
  return <RoomsClient />;
}
