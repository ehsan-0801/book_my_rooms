"use client";

import { FormShell } from "@/components/dashboard/form";
import { ContentPageForm } from "@/components/dashboard/page-form";
import { updateContentPage } from "@/lib/actions/catalog";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"pages/detail">;

export function EditContentPageClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/pages/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditContentPageView data={data} />;
}

function EditContentPageView({ data: page }: { data: ViewData }) {

  return (
    <FormShell
      title={`Edit ${page.title}`}
      backHref="/dashboard/pages"
      backLabel="Back to pages"
    >
      <ContentPageForm action={updateContentPage} page={page} submitLabel="Save changes" />
    </FormShell>
  );
}

