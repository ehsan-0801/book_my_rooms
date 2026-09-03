import type { Metadata } from "next";

import { SettingsClient } from "@/components/dashboard/views/settings-client";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

/** Server shell: emits metadata; the body renders client-side. */
export default function SettingsPage() {
  return <SettingsClient />;
}
