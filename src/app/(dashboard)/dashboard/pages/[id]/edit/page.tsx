import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormShell } from "@/components/dashboard/form";
import { ContentPageForm } from "@/components/dashboard/page-form";
import { requireAdmin } from "@/lib/auth-guards";
import { updateContentPage } from "@/lib/actions/catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit page", robots: { index: false } };

export default async function EditContentPage({
  params,
}: PageProps<"/dashboard/pages/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const page = await prisma.contentPage.findUnique({ where: { id } });
  if (!page) notFound();

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
