import type { Metadata } from "next";

import { NewRoomClient } from "@/components/dashboard/views/rooms-new-client";

export const metadata: Metadata = { title: "Add room", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewRoomPage() {
  return <NewRoomClient />;
}
