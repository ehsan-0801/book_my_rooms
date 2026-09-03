import type { Metadata } from "next";

import { AreasClient } from "@/components/dashboard/views/areas-client";

export const metadata: Metadata = { title: "Areas", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function AreasPage() {
  return <AreasClient />;
}
