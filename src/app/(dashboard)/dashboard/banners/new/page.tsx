import type { Metadata } from "next";

import { BannerForm } from "@/components/dashboard/banner-form";
import { FormShell } from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { createBanner } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "New banner", robots: { index: false } };

export default async function NewBannerPage() {
  await requireAdmin();
  return (
    <FormShell
      title="New banner"
      description="Wide artwork works best — roughly 3:1."
      backHref="/dashboard/banners"
      backLabel="Back to banners"
    >
      <BannerForm action={createBanner} submitLabel="Create banner" />
    </FormShell>
  );
}
