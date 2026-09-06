import type { Metadata } from "next";

import { EditUserClient } from "@/components/dashboard/views/users-id-edit-client";

export const metadata: Metadata = { title: "Edit user", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function EditUserPage({ params }: PageProps<"/dashboard/users/[id]/edit">) {
  const { id } = await params;
  return <EditUserClient id={id} />;
}
