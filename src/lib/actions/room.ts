"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  assertPropertyAccess,
  assertRoomAccess,
  recordAudit,
  requireAdminOrVendor,
} from "@/lib/rbac";
import { fail, guard, ok, warn, type ActionResult } from "./result";

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

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

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
    return Array.isArray(parsed)
      ? parsed.filter((i) => typeof i?.url === "string")
      : [];
  } catch {
    return [];
  }
}

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

export async function createRoom(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminOrVendor();
    const parsed = parseForm(formData);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check the room details", errors);
    }
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
    return ok(`${d.name} created with 120 nights open`, "/dashboard/rooms");
  });
}

export async function updateRoom(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminOrVendor();
    const id = String(formData.get("id") ?? "");
    await assertRoomAccess(actor, id);

    const parsed = parseForm(formData);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check the room details", errors);
    }
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
    return ok(`${d.name} saved`, "/dashboard/rooms");
  });
}

export async function deleteRoom(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminOrVendor();
    const id = String(formData.get("id") ?? "");
    const room = await assertRoomAccess(actor, id);

    const live = await prisma.bookingItem.count({
      where: {
        roomId: id,
        booking: { status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED"] } },
      },
    });
    if (live > 0) {
      return warn(
        `This room has ${live} active booking${live === 1 ? "" : "s"} — resolve them first`,
      );
    }

    const record = await prisma.room.findUnique({
      where: { id },
      select: { name: true },
    });
    await prisma.room.delete({ where: { id } });
    await syncPropertyBasePrice(room.propertyId);
    await recordAudit(actor.id, "room.delete", "Room", id);
    revalidatePath("/dashboard/rooms");
    return ok(`${record?.name ?? "Room"} deleted`);
  });
}

/** Quick inline rate/inventory edit from the rooms table. */
export async function updateRoomRate(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminOrVendor();
    const parsed = z
      .object({
        roomId: z.string().min(1),
        basePrice: z.coerce.number().min(0).max(1_000_000),
        discountValue: z.coerce.number().min(0).max(90).optional(),
        totalUnits: z.coerce.number().int().min(0).max(500),
      })
      .safeParse({
        roomId: formData.get("roomId"),
        basePrice: formData.get("basePrice"),
        discountValue: formData.get("discountValue") || undefined,
        totalUnits: formData.get("totalUnits"),
      });
    if (!parsed.success) return fail("Check the rate, discount and room count");

    const { roomId, basePrice, discountValue, totalUnits } = parsed.data;
    await assertRoomAccess(actor, roomId);

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        basePrice,
        totalUnits,
        discountType: discountValue ? "PERCENTAGE" : null,
        discountValue: discountValue ?? null,
      },
      select: { propertyId: true, name: true },
    });

    await syncPropertyBasePrice(room.propertyId);
    revalidatePath("/dashboard/rooms");
    return ok(`${room.name} rate updated`);
  });
}
