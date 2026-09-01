"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  assertPropertyAccess,
  recordAudit,
  requireAdminOrVendor,
} from "@/lib/rbac";

const imageSchema = z.array(
  z.object({ url: z.string().url(), publicId: z.string().optional() }),
);

const propertySchema = z.object({
  name: z.string().min(3, "Enter a property name"),
  typeId: z.string().min(1, "Choose a property type"),
  districtId: z.string().min(1, "Choose a destination"),
  areaId: z.string().optional(),
  category: z.enum(["LUXURY", "STANDARD", "BUDGET"]),
  shortDescription: z.string().max(200).optional(),
  description: z.string().min(20, "Write at least a couple of sentences"),
  addressLine: z.string().min(5, "Enter the full address"),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  starRating: z.coerce.number().int().min(1).max(5).optional(),
  checkInTime: z.string().min(1),
  checkOutTime: z.string().min(1),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  policies: z.string().optional(),
  rules: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  basePrice: z.coerce.number().min(0),
  amenityIds: z.array(z.string()).optional(),
  images: z.string().optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

function parseForm(formData: FormData) {
  return propertySchema.safeParse({
    name: formData.get("name"),
    typeId: formData.get("typeId"),
    districtId: formData.get("districtId"),
    areaId: formData.get("areaId") || undefined,
    category: formData.get("category"),
    shortDescription: formData.get("shortDescription") || undefined,
    description: formData.get("description"),
    addressLine: formData.get("addressLine"),
    contactPhone: formData.get("contactPhone") || undefined,
    contactEmail: formData.get("contactEmail") || "",
    website: formData.get("website") || "",
    starRating: formData.get("starRating") || undefined,
    checkInTime: formData.get("checkInTime") || "14:00",
    checkOutTime: formData.get("checkOutTime") || "12:00",
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    policies: formData.get("policies") || undefined,
    rules: formData.get("rules") || undefined,
    cancellationPolicy: formData.get("cancellationPolicy") || undefined,
    basePrice: formData.get("basePrice") || 0,
    amenityIds: formData.getAll("amenityIds").map(String).filter(Boolean),
    images: formData.get("images")?.toString() ?? "[]",
  });
}

function readImages(raw?: string) {
  if (!raw) return [];
  try {
    return imageSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function createProperty(formData: FormData) {
  const actor = await requireAdminOrVendor();
  const parsed = parseForm(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  // A vendor always creates under their own account; only an admin may pick.
  const vendorId =
    actor.role === "ADMIN"
      ? (formData.get("vendorId")?.toString() ?? "")
      : actor.vendorId!;
  if (!vendorId) throw new Error("Choose which vendor owns this property");

  const images = readImages(d.images);
  const slug = `${slugify(d.name)}-${Date.now().toString(36).slice(-4)}`;

  const property = await prisma.property.create({
    data: {
      vendorId,
      typeId: d.typeId,
      districtId: d.districtId,
      areaId: d.areaId || null,
      name: d.name,
      slug,
      category: d.category,
      shortDescription: d.shortDescription ?? null,
      description: d.description,
      addressLine: d.addressLine,
      contactPhone: d.contactPhone ?? null,
      contactEmail: d.contactEmail || null,
      website: d.website || null,
      starRating: d.starRating ?? null,
      checkInTime: d.checkInTime,
      checkOutTime: d.checkOutTime,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      policies: d.policies ?? null,
      rules: d.rules ?? null,
      cancellationPolicy: d.cancellationPolicy ?? null,
      basePrice: d.basePrice,
      // Vendor submissions queue for admin review; admins publish directly.
      status: actor.role === "ADMIN" ? "PUBLISHED" : "PENDING_REVIEW",
      metaTitle: `${d.name} — Book My Rooms`,
      metaDescription: d.shortDescription ?? null,
      images: {
        create: images.map((img, i) => ({
          url: img.url,
          sortOrder: i,
          isCover: i === 0,
        })),
      },
      amenities: {
        create: (d.amenityIds ?? []).map((amenityId) => ({ amenityId })),
      },
    },
    select: { id: true },
  });

  await recordAudit(actor.id, "property.create", "Property", property.id, { name: d.name });
  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function updateProperty(formData: FormData) {
  const actor = await requireAdminOrVendor();
  const id = formData.get("id")?.toString() ?? "";
  await assertPropertyAccess(actor, id);

  const parsed = parseForm(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  const images = readImages(d.images);

  await prisma.property.update({
    where: { id },
    data: {
      typeId: d.typeId,
      districtId: d.districtId,
      areaId: d.areaId || null,
      name: d.name,
      category: d.category,
      shortDescription: d.shortDescription ?? null,
      description: d.description,
      addressLine: d.addressLine,
      contactPhone: d.contactPhone ?? null,
      contactEmail: d.contactEmail || null,
      website: d.website || null,
      starRating: d.starRating ?? null,
      checkInTime: d.checkInTime,
      checkOutTime: d.checkOutTime,
      latitude: d.latitude ?? null,
      longitude: d.longitude ?? null,
      policies: d.policies ?? null,
      rules: d.rules ?? null,
      cancellationPolicy: d.cancellationPolicy ?? null,
      basePrice: d.basePrice,
    },
  });

  // Amenities are a full replace — simpler than diffing a checkbox set.
  await prisma.propertyAmenity.deleteMany({ where: { propertyId: id } });
  if (d.amenityIds?.length) {
    await prisma.propertyAmenity.createMany({
      data: d.amenityIds.map((amenityId) => ({ propertyId: id, amenityId })),
      skipDuplicates: true,
    });
  }

  // Only replace images when the form actually sent some, so an edit that
  // didn't touch the uploader doesn't wipe the gallery.
  if (images.length) {
    await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
    await prisma.propertyImage.createMany({
      data: images.map((img, i) => ({
        propertyId: id, url: img.url, sortOrder: i, isCover: i === 0,
      })),
    });
  }

  await recordAudit(actor.id, "property.update", "Property", id, { name: d.name });
  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function deleteProperty(formData: FormData) {
  const actor = await requireAdminOrVendor();
  const id = formData.get("id")?.toString() ?? "";
  await assertPropertyAccess(actor, id);

  // Refuse while money or guests are attached — cancel those first.
  const live = await prisma.booking.count({
    where: {
      propertyId: id,
      status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED"] },
    },
  });
  if (live > 0) {
    throw new Error(
      `This property has ${live} active booking${live === 1 ? "" : "s"}. Cancel or complete them first.`,
    );
  }

  await prisma.property.delete({ where: { id } });
  await recordAudit(actor.id, "property.delete", "Property", id);
  revalidatePath("/dashboard/properties");
}
