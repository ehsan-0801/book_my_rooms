"use client";

import Link from "next/link";

import { FormShell } from "@/components/dashboard/form";
import { RoomForm } from "@/components/dashboard/room-form";
import { EmptyState } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { createRoom } from "@/lib/actions/room";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"rooms/form">;

export function NewRoomClient() {
  const { data, loading, error } = useApi<ViewData>("/api/dashboard/rooms/form");

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <NewRoomView data={data} />;
}

function NewRoomView({ data }: { data: ViewData }) {
  const { properties, amenities } = data;

  if (properties.length === 0) {
    return (
      <EmptyState
        icon="Building2"
        title="Add a property first"
        body="Rooms belong to a property, so you'll need at least one before you can add room types."
        action={
          <Button asChild>
            <Link href="/dashboard/properties/new">Add property</Link>
          </Button>
        }
      />
    );
  }

  return (
    <FormShell
      title="Add a room type"
      description="Guests book room types, not individual rooms — set how many you have of each."
      backHref="/dashboard/rooms"
      backLabel="Back to rooms"
    >
      <RoomForm
        action={createRoom}
        properties={properties}
        amenities={amenities}
        submitLabel="Create room"
      />
    </FormShell>
  );
}

