"use client";

import { BannerForm } from "@/components/dashboard/banner-form";
import { FormShell } from "@/components/dashboard/form";
import { updateBanner } from "@/lib/actions/catalog";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"banners/detail">;

export function EditBannerClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/banners/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditBannerView data={data} />;
}

function EditBannerView({ data: banner }: { data: ViewData }) {

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

