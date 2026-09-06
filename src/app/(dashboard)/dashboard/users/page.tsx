import type { Metadata } from "next";

import { UsersClient } from "@/components/dashboard/views/users-client";

export const metadata: Metadata = { title: "Users", robots: { index: false } };

/** Server shell: emits metadata; the list renders client-side. */
export default function UsersPage() {
  return <UsersClient />;
}
