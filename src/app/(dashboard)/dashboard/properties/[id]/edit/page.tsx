import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormShell } from "@/components/dashboard/form";
import { PropertyForm } from "@/components/dashboard/property-form";
import { requireRole } from "@/lib/auth-guards";
import { updateProperty } from "@/lib/actions/property";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit property", robots: { index: false } };

export default async function EditPropertyPage({
  params,
}: PageProps<"/dashboard/properties/[id]/edit">) {
  const user = await requireRole("ADMIN", "VENDOR");
  const { id } = await params;

  // Scoping the read to the vendor is the access check — a vendor querying
  // someone else's id simply gets nothing.
  const property = await prisma.property.findFirst({
    where: {
      id,
      ...(user.role === "ADMIN" ? {} : { vendorId: user.vendorId ?? "__none__" }),
    },
    select: {
      id: true, name: true, typeId: true, districtId: true, areaId: true,
      category: true, shortDescription: true, description: true, addressLine: true,
      contactPhone: true, contactEmail: true, website: true, starRating: true,
      checkInTime: true, checkOutTime: true, latitude: true, longitude: true,
      policies: true, rules: true, cancellationPolicy: true, basePrice: true,
      amenities: { select: { amenityId: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });
  if (!property) notFound();

  const [types, districts, amenities] = await Promise.all([
    prisma.propertyType.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.district.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.amenity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <FormShell
      title={`Edit ${property.name}`}
      description="Changes go live immediately for a published property."
      backHref="/dashboard/properties"
      backLabel="Back to properties"
    >
      <PropertyForm
        action={updateProperty}
        types={types}
        districts={districts}
        amenities={amenities}
        submitLabel="Save changes"
        property={{
          ...property,
          basePrice: Number(property.basePrice),
          amenityIds: property.amenities.map((a) => a.amenityId),
          images: property.images.map((img) => ({
            url: img.url,
            publicId: "",
            width: 0,
            height: 0,
          })),
        }}
      />
    </FormShell>
  );
}
