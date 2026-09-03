import type { Metadata } from "next";

import { EditRoomClient } from "@/components/dashboard/views/rooms-id-edit-client";

export const metadata: Metadata = { title: "Edit room", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditRoomPage({
  params,
}: PageProps<"/dashboard/rooms/[id]/edit">) {
  const { id } = await params;
  return <EditRoomClient id={id} />;
}
