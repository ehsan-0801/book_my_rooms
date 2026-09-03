"use client";

import { BannerForm } from "@/components/dashboard/banner-form";
import { FormShell } from "@/components/dashboard/form";
import { createBanner } from "@/lib/actions/catalog";

export function NewBannerClient() {
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
