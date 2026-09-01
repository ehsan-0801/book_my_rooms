"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  assertPropertyAccess,
  assertRoomAccess,
  recordAudit,
  requireAdminOrVendor,
} from "@/lib/rbac";

const roomSchema = z.object({
  propertyId: z.string().min(1, "Choose a property"),
  name: z.string().min(2, "Enter a room name"),
  description: z.string().optional(),
  bedType: z.string().optional(),
  maxGuests: z.coerce.number().int().min(1).max(20),
  maxAdults: z.coerce.number().int().min(1).max(20),
  maxChildren: z.coerce.number().int().min(0).max(10),
  sizeSqft: z.coerce.number().int().min(0).max(20000).optional(),
  totalUnits: z.coerce.number().int().min(0).max(500),
  basePrice: z.coerce.number().min(0).max(1_000_000),
  discountValue: z.coerce.number().min(0).max(90).optional(),
  breakfastIncluded: z.coerce.boolean().optional(),
  isRefundable: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  amenityIds: z.array(z.string()).optional(),
  images: z.string().optional(),
});

function parseForm(formData: FormData) {
  return roomSchema.safeParse({
    propertyId: formData.get("propertyId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    bedType: formData.get("bedType") || undefined,
    maxGuests: formData.get("maxGuests") || 2,
    maxAdults: formData.get("maxAdults") || 2,
    maxChildren: formData.get("maxChildren") || 0,
    sizeSqft: formData.get("sizeSqft") || undefined,
    totalUnits: formData.get("totalUnits") || 1,
    basePrice: formData.get("basePrice") || 0,
    discountValue: formData.get("discountValue") || undefined,
    breakfastIncluded: formData.get("breakfastIncluded") === "true",
    isRefundable: formData.get("isRefundable") === "true",
    isActive: formData.get("isActive") === "true",
    amenityIds: formData.getAll("amenityIds").map(String).filter(Boolean),
    images: formData.get("images")?.toString() ?? "[]",
  });
}

function readImages(raw?: string): { url: string }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((i) => typeof i?.url === "string") : [];
  } catch {
    return [];
  }
}

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** Property.basePrice powers the search price filter, so it follows the rooms. */
async function syncPropertyBasePrice(propertyId: string) {
  const cheapest = await prisma.room.aggregate({
    where: { propertyId, isActive: true },
    _min: { basePrice: true },
  });
  if (cheapest._min?.basePrice != null) {
    await prisma.property.update({
      where: { id: propertyId },
      data: { basePrice: cheapest._min.basePrice },
    });
  }
}

export async function createRoom(formData: FormData) {
  const actor = await requireAdminOrVendor();
  const parsed = parseForm(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  await assertPropertyAccess(actor, d.propertyId);
  const images = readImages(d.images);

  const room = await prisma.room.create({
    data: {
      propertyId: d.propertyId,
      name: d.name,
      slug: `${slugify(d.name)}-${Date.now().toString(36).slice(-4)}`,
      description: d.description ?? null,
      bedType: d.bedType ?? null,
      maxGuests: d.maxGuests,
      maxAdults: d.maxAdults,
      maxChildren: d.maxChildren,
      sizeSqft: d.sizeSqft ?? null,
      totalUnits: d.totalUnits,
      basePrice: d.basePrice,
      discountType: d.discountValue ? "PERCENTAGE" : null,
      discountValue: d.discountValue ?? null,
      breakfastIncluded: d.breakfastIncluded ?? false,
      isRefundable: d.isRefundable ?? true,
      isActive: d.isActive ?? true,
      images: { create: images.map((img, i) => ({ url: img.url, sortOrder: i })) },
      amenities: { create: (d.amenityIds ?? []).map((amenityId) => ({ amenityId })) },
    },
    select: { id: true },
  });

  // Open the next 120 nights so the room is immediately bookable.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await prisma.roomAvailability.createMany({
    data: Array.from({ length: 120 }, (_, i) => {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + i);
      return { roomId: room.id, date, unitsOpen: d.totalUnits };
    }),
    skipDuplicates: true,
  });

  await syncPropertyBasePrice(d.propertyId);
  await recordAudit(actor.id, "room.create", "Room", room.id, { name: d.name });
  revalidatePath("/dashboard/rooms");
  redirect("/dashboard/rooms");
}

export async function updateRoom(formData: FormData) {
  const actor = await requireAdminOrVendor();
  const id = formData.get("id")?.toString() ?? "";
  await assertRoomAccess(actor, id);

  const parsed = parseForm(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  const images = readImages(d.images);

  await prisma.room.update({
    where: { id },
    data: {
      name: d.name,
      description: d.description ?? null,
      bedType: d.bedType ?? null,
      maxGuests: d.maxGuests,
      maxAdults: d.maxAdults,
      maxChildren: d.maxChildren,
      sizeSqft: d.sizeSqft ?? null,
      totalUnits: d.totalUnits,
      basePrice: d.basePrice,
      discountType: d.discountValue ? "PERCENTAGE" : null,
      discountValue: d.discountValue ?? null,
      breakfastIncluded: d.breakfastIncluded ?? false,
      isRefundable: d.isRefundable ?? true,
      isActive: d.isActive ?? true,
    },
  });

  await prisma.roomAmenity.deleteMany({ where: { roomId: id } });
  if (d.amenityIds?.length) {
    await prisma.roomAmenity.createMany({
      data: d.amenityIds.map((amenityId) => ({ roomId: id, amenityId })),
      skipDuplicates: true,
    });
  }

  if (images.length) {
    await prisma.roomImage.deleteMany({ where: { roomId: id } });
    await prisma.roomImage.createMany({
      data: images.map((img, i) => ({ roomId: id, url: img.url, sortOrder: i })),
    });
  }

  await syncPropertyBasePrice(d.propertyId);
  await recordAudit(actor.id, "room.update", "Room", id, { name: d.name });
  revalidatePath("/dashboard/rooms");
  redirect("/dashboard/rooms");
}

export async function deleteRoom(formData: FormData) {
  const actor = await requireAdminOrVendor();
  const id = formData.get("id")?.toString() ?? "";
  const room = await assertRoomAccess(actor, id);

  const live = await prisma.bookingItem.count({
    where: {
      roomId: id,
      booking: { status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED"] } },
    },
  });
  if (live > 0) {
    throw new Error(
      `This room has ${live} active booking${live === 1 ? "" : "s"}. Resolve them first.`,
    );
  }

  await prisma.room.delete({ where: { id } });
  await syncPropertyBasePrice(room.propertyId);
  await recordAudit(actor.id, "room.delete", "Room", id);
  revalidatePath("/dashboard/rooms");
}
