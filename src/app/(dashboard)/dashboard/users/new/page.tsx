import type { Metadata } from "next";

import { NewUserClient } from "@/components/dashboard/views/users-new-client";

export const metadata: Metadata = { title: "Add user", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default function NewUserPage() {
  return <NewUserClient />;
}
