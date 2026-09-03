"use client";

import { FormShell } from "@/components/dashboard/form";
import { ContentPageForm } from "@/components/dashboard/page-form";
import { createContentPage } from "@/lib/actions/catalog";

export function NewContentPageClient() {
  return (
    <FormShell
      title="New page"
      description="Published pages are reachable at /your-slug."
      backHref="/dashboard/pages"
      backLabel="Back to pages"
    >
      <ContentPageForm action={createContentPage} submitLabel="Create page" />
    </FormShell>
  );
}
