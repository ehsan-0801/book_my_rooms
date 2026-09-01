import type { Metadata } from "next";

import { FormShell } from "@/components/dashboard/form";
import { PropertyForm } from "@/components/dashboard/property-form";
import { requireRole } from "@/lib/auth-guards";
import { createProperty } from "@/lib/actions/property";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Add property", robots: { index: false } };

export default async function NewPropertyPage() {
  const user = await requireRole("ADMIN", "VENDOR");
  const isAdmin = user.role === "ADMIN";

  const [types, districts, amenities, vendors] = await Promise.all([
    prisma.propertyType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.district.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.amenity.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    isAdmin
      ? prisma.vendor.findMany({
          where: { status: "APPROVED" },
          orderBy: { businessName: "asc" },
          select: { id: true, businessName: true },
        })
      : Promise.resolve(undefined),
  ]);

  return (
    <FormShell
      title="Add a property"
      description={
        isAdmin
          ? "Created as published. Assign it to the vendor who runs it."
          : "Your listing goes to an admin for review before it appears in search."
      }
      backHref="/dashboard/properties"
      backLabel="Back to properties"
    >
      <PropertyForm
        action={createProperty}
        types={types}
        districts={districts}
        amenities={amenities}
        vendors={vendors}
        submitLabel="Create property"
      />
    </FormShell>
  );
}
