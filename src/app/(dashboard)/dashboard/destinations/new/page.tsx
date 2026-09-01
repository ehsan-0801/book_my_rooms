import type { Metadata } from "next";

import { DestinationForm } from "@/components/dashboard/destination-form";
import { FormShell } from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { createDistrict } from "@/lib/actions/catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "New destination", robots: { index: false } };

export default async function NewDestinationPage() {
  await requireAdmin();
  const divisions = await prisma.division.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <FormShell
      title="New destination"
      description="Destinations become their own landing page and search filter."
      backHref="/dashboard/destinations"
      backLabel="Back to destinations"
    >
      <DestinationForm
        action={createDistrict}
        divisions={divisions}
        submitLabel="Create destination"
      />
    </FormShell>
  );
}
