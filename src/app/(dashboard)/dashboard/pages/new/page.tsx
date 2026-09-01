import type { Metadata } from "next";

import { FormShell } from "@/components/dashboard/form";
import { ContentPageForm } from "@/components/dashboard/page-form";
import { requireAdmin } from "@/lib/auth-guards";
import { createContentPage } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "New page", robots: { index: false } };

export default async function NewContentPage() {
  await requireAdmin();
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
