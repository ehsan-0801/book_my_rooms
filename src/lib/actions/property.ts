"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { assertPropertyAccess, recordAudit, requireAdminOrVendor } from "@/lib/rbac";
import { fail, guard, ok, warn, type ActionResult } from "./result";

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

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

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

export async function createProperty(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminOrVendor();
    const parsed = parseForm(formData);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check the property details", errors);
    }
    const d = parsed.data;

    // A vendor always creates under their own account; only an admin may pick.
    const vendorId =
      actor.role === "ADMIN" ? String(formData.get("vendorId") ?? "") : actor.vendorId!;
    if (!vendorId) return fail("Choose which vendor owns this property");

    const images = readImages(d.images);
    const property = await prisma.property.create({
      data: {
        vendorId,
        typeId: d.typeId,
        districtId: d.districtId,
        areaId: d.areaId || null,
        name: d.name,
        slug: `${slugify(d.name)}-${Date.now().toString(36).slice(-4)}`,
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
            url: img.url, sortOrder: i, isCover: i === 0,
          })),
        },
        amenities: { create: (d.amenityIds ?? []).map((amenityId) => ({ amenityId })) },
      },
      select: { id: true },
    });

    await recordAudit(actor.id, "property.create", "Property", property.id, { name: d.name });
    revalidatePath("/dashboard/properties");

    return actor.role === "ADMIN"
      ? ok(`${d.name} created and published`, "/dashboard/properties")
      : ok(`${d.name} submitted for review`, "/dashboard/properties");
  });
}

export async function updateProperty(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminOrVendor();
    const id = String(formData.get("id") ?? "");
    await assertPropertyAccess(actor, id);

    const parsed = parseForm(formData);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check the property details", errors);
    }
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
    revalidatePath("/");
    return ok(`${d.name} saved`, "/dashboard/properties");
  });
}

export async function deleteProperty(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminOrVendor();
    const id = String(formData.get("id") ?? "");
    const property = await assertPropertyAccess(actor, id);

    // Refuse while money or guests are attached — cancel those first.
    const live = await prisma.booking.count({
      where: {
        propertyId: id,
        status: { in: ["PENDING", "PAYMENT_PENDING", "CONFIRMED"] },
      },
    });
    if (live > 0) {
      return warn(
        `This property has ${live} active booking${live === 1 ? "" : "s"} — cancel or complete them first`,
      );
    }

    const record = await prisma.property.findUnique({
      where: { id },
      select: { name: true },
    });
    await prisma.property.delete({ where: { id } });
    await recordAudit(actor.id, "property.delete", "Property", property.id);
    revalidatePath("/dashboard/properties");
    revalidatePath("/");
    return ok(`${record?.name ?? "Property"} deleted`);
  });
}
