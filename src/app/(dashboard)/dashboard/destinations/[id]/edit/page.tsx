import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DestinationForm } from "@/components/dashboard/destination-form";
import { FormShell } from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { updateDistrict } from "@/lib/actions/catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit destination", robots: { index: false } };

export default async function EditDestinationPage({
  params,
}: PageProps<"/dashboard/destinations/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;

  const [district, divisions] = await Promise.all([
    prisma.district.findUnique({ where: { id } }),
    prisma.division.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!district) notFound();

  return (
    <FormShell
      title={`Edit ${district.name}`}
      backHref="/dashboard/destinations"
      backLabel="Back to destinations"
    >
      <DestinationForm
        action={updateDistrict}
        divisions={divisions}
        destination={district}
        submitLabel="Save changes"
      />
    </FormShell>
  );
}
