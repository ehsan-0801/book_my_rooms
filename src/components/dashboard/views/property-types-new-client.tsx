"use client";

import { FormShell } from "@/components/dashboard/form";
import { PropertyTypeForm } from "@/components/dashboard/property-type-form";
import { createPropertyType } from "@/lib/actions/catalog";

export function NewPropertyTypeClient() {
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
