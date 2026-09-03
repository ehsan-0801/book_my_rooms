import type { Metadata } from "next";

import { DashboardOverviewClient } from "@/components/dashboard/views/overview-client";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function DashboardPage() {
  return <DashboardOverviewClient />;
}
