import type { Metadata } from "next";

import { UserDetailClient } from "@/components/dashboard/views/users-id-client";

export const metadata: Metadata = { title: "User", robots: { index: false } };

/** Server shell: emits metadata; the detail renders client-side. */
export default async function UserPage({ params }: PageProps<"/dashboard/users/[id]">) {
  const { id } = await params;
  return <UserDetailClient id={id} />;
}
