import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormShell } from "@/components/dashboard/form";
import { PropertyTypeForm } from "@/components/dashboard/property-type-form";
import { requireAdmin } from "@/lib/auth-guards";
import { updatePropertyType } from "@/lib/actions/catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit property type", robots: { index: false } };

export default async function EditPropertyTypePage({
  params,
}: PageProps<"/dashboard/property-types/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const type = await prisma.propertyType.findUnique({ where: { id } });
  if (!type) notFound();

  return (
    <FormShell
      title={`Edit ${type.name}`}
      backHref="/dashboard/property-types"
      backLabel="Back to property types"
    >
      <PropertyTypeForm action={updatePropertyType} type={type} submitLabel="Save changes" />
    </FormShell>
  );
}
