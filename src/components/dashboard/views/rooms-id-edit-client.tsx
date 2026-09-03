"use client";

import { FormShell } from "@/components/dashboard/form";
import { RoomForm } from "@/components/dashboard/room-form";
import { updateRoom } from "@/lib/actions/room";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"rooms/form">;

export function EditRoomClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/rooms/form/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditRoomView data={data} />;
}

function EditRoomView({ data }: { data: ViewData }) {
  const { properties, amenities } = data;
  const room = data.room!;

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

