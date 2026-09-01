import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FormShell } from "@/components/dashboard/form";
import { RoomForm } from "@/components/dashboard/room-form";
import { requireRole } from "@/lib/auth-guards";
import { updateRoom } from "@/lib/actions/room";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit room", robots: { index: false } };

export default async function EditRoomPage({
  params,
}: PageProps<"/dashboard/rooms/[id]/edit">) {
  const user = await requireRole("ADMIN", "VENDOR");
  const { id } = await params;

  const room = await prisma.room.findFirst({
    where: {
      id,
      ...(user.role === "ADMIN"
        ? {}
        : { property: { vendorId: user.vendorId ?? "__none__" } }),
    },
    select: {
      id: true, propertyId: true, name: true, description: true, bedType: true,
      maxGuests: true, maxAdults: true, maxChildren: true, sizeSqft: true,
      totalUnits: true, basePrice: true, discountValue: true,
      breakfastIncluded: true, isRefundable: true, isActive: true,
      amenities: { select: { amenityId: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  });
  if (!room) notFound();

  const [properties, amenities] = await Promise.all([
    prisma.property.findMany({
      where: user.role === "ADMIN" ? {} : { vendorId: user.vendorId ?? "__none__" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.amenity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <FormShell
      title={`Edit ${room.name}`}
      description="Rate and inventory changes apply to future bookings only."
      backHref="/dashboard/rooms"
      backLabel="Back to rooms"
    >
      <RoomForm
        action={updateRoom}
        properties={properties}
        amenities={amenities}
        submitLabel="Save changes"
        room={{
          ...room,
          basePrice: Number(room.basePrice),
          discountValue: room.discountValue ? Number(room.discountValue) : null,
          amenityIds: room.amenities.map((a) => a.amenityId),
          images: room.images.map((img) => ({
            url: img.url, publicId: "", width: 0, height: 0,
          })),
        }}
      />
    </FormShell>
  );
}
