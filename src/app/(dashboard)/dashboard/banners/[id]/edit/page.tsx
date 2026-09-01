import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BannerForm } from "@/components/dashboard/banner-form";
import { FormShell } from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { updateBanner } from "@/lib/actions/catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit banner", robots: { index: false } };

export default async function EditBannerPage({
  params,
}: PageProps<"/dashboard/banners/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) notFound();

  return (
    <FormShell
      title={`Edit "${banner.title}"`}
      backHref="/dashboard/banners"
      backLabel="Back to banners"
    >
      <BannerForm action={updateBanner} banner={banner} submitLabel="Save changes" />
    </FormShell>
  );
}
