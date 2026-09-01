import type { Metadata } from "next";
import Link from "next/link";

import { FormShell } from "@/components/dashboard/form";
import { RoomForm } from "@/components/dashboard/room-form";
import { EmptyState } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth-guards";
import { createRoom } from "@/lib/actions/room";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Add room", robots: { index: false } };

export default async function NewRoomPage() {
  const user = await requireRole("ADMIN", "VENDOR");

  const [properties, amenities] = await Promise.all([
    prisma.property.findMany({
      where: user.role === "ADMIN" ? {} : { vendorId: user.vendorId ?? "__none__" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.amenity.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

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
