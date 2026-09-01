import type { Metadata } from "next";

import { FormShell } from "@/components/dashboard/form";
import { PropertyTypeForm } from "@/components/dashboard/property-type-form";
import { requireAdmin } from "@/lib/auth-guards";
import { createPropertyType } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "New property type", robots: { index: false } };

export default async function NewPropertyTypePage() {
  await requireAdmin();
  return (
    <FormShell
      title="New property type"
      description="Types appear as filters on search and as a choice when listing."
      backHref="/dashboard/property-types"
      backLabel="Back to property types"
    >
      <PropertyTypeForm action={createPropertyType} submitLabel="Create type" />
    </FormShell>
  );
}
