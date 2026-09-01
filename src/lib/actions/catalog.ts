"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAudit, requireAdminActor, requireVendorActor } from "@/lib/rbac";

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/* ------------------------------------------------------------- coupons */

const couponSchema = z.object({
  code: z.string().min(3).max(24).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  minSpend: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  isActive: z.coerce.boolean().optional(),
});

function parseCoupon(formData: FormData) {
  return couponSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    value: formData.get("value"),
    maxDiscount: formData.get("maxDiscount") || undefined,
    minSpend: formData.get("minSpend") || undefined,
    usageLimit: formData.get("usageLimit") || undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    isActive: formData.get("isActive") === "true",
  });
}

export async function createCoupon(formData: FormData) {
  const actor = await requireAdminActor();
  const parsed = parseCoupon(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  if (new Date(d.endsAt) <= new Date(d.startsAt)) {
    throw new Error("The end date must be after the start date");
  }
  if (d.type === "PERCENTAGE" && d.value > 100) {
    throw new Error("A percentage discount can't exceed 100%");
  }

  const existing = await prisma.coupon.findUnique({
    where: { code: d.code.toUpperCase() },
    select: { id: true },
  });
  if (existing) throw new Error("That coupon code already exists");

  const coupon = await prisma.coupon.create({
    data: {
      code: d.code.toUpperCase(),
      description: d.description ?? null,
      type: d.type,
      value: d.value,
      maxDiscount: d.maxDiscount ?? null,
      minSpend: d.minSpend ?? null,
      usageLimit: d.usageLimit ?? null,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
      isActive: d.isActive ?? true,
    },
    select: { id: true },
  });

  await recordAudit(actor.id, "coupon.create", "Coupon", coupon.id, { code: d.code });
  revalidatePath("/dashboard/coupons");
  redirect("/dashboard/coupons");
}

export async function updateCoupon(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";
  const parsed = parseCoupon(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  if (new Date(d.endsAt) <= new Date(d.startsAt)) {
    throw new Error("The end date must be after the start date");
  }

  await prisma.coupon.update({
    where: { id },
    data: {
      code: d.code.toUpperCase(),
      description: d.description ?? null,
      type: d.type,
      value: d.value,
      maxDiscount: d.maxDiscount ?? null,
      minSpend: d.minSpend ?? null,
      usageLimit: d.usageLimit ?? null,
      startsAt: new Date(d.startsAt),
      endsAt: new Date(d.endsAt),
      isActive: d.isActive ?? true,
    },
  });

  await recordAudit(actor.id, "coupon.update", "Coupon", id, { code: d.code });
  revalidatePath("/dashboard/coupons");
  redirect("/dashboard/coupons");
}

export async function deleteCoupon(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";

  const used = await prisma.booking.count({ where: { couponId: id } });
  if (used > 0) {
    throw new Error(
      `This coupon is attached to ${used} booking${used === 1 ? "" : "s"}. Deactivate it instead.`,
    );
  }

  await prisma.coupon.delete({ where: { id } });
  await recordAudit(actor.id, "coupon.delete", "Coupon", id);
  revalidatePath("/dashboard/coupons");
}

export async function toggleCoupon(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";
  const current = await prisma.coupon.findUniqueOrThrow({
    where: { id },
    select: { isActive: true },
  });
  await prisma.coupon.update({ where: { id }, data: { isActive: !current.isActive } });
  await recordAudit(actor.id, "coupon.toggle", "Coupon", id);
  revalidatePath("/dashboard/coupons");
}

/* ------------------------------------------------------------- banners */

const bannerSchema = z.object({
  title: z.string().min(3, "Enter a title"),
  imageUrl: z.string().min(1, "Upload or paste an image URL"),
  linkUrl: z.string().optional(),
  position: z.enum(["home_hero", "home_mid", "search_side"]),
  sortOrder: z.coerce.number().int().min(0).max(99),
  isActive: z.coerce.boolean().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

function parseBanner(formData: FormData) {
  // The uploader posts a JSON array; fall back to a pasted URL.
  let imageUrl = formData.get("imageUrl")?.toString() ?? "";
  const uploaded = formData.get("images")?.toString();
  if (uploaded) {
    try {
      const list = JSON.parse(uploaded);
      if (Array.isArray(list) && list[0]?.url) imageUrl = list[0].url;
    } catch {
      /* keep the pasted value */
    }
  }

  return bannerSchema.safeParse({
    title: formData.get("title"),
    imageUrl,
    linkUrl: formData.get("linkUrl") || undefined,
    position: formData.get("position") || "home_hero",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "true",
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
  });
}

export async function createBanner(formData: FormData) {
  const actor = await requireAdminActor();
  const parsed = parseBanner(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const banner = await prisma.banner.create({
    data: {
      title: d.title,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl ?? null,
      position: d.position,
      sortOrder: d.sortOrder,
      isActive: d.isActive ?? true,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
    },
    select: { id: true },
  });

  await recordAudit(actor.id, "banner.create", "Banner", banner.id, { title: d.title });
  revalidatePath("/dashboard/banners");
  redirect("/dashboard/banners");
}

export async function updateBanner(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";
  const parsed = parseBanner(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  await prisma.banner.update({
    where: { id },
    data: {
      title: d.title,
      imageUrl: d.imageUrl,
      linkUrl: d.linkUrl ?? null,
      position: d.position,
      sortOrder: d.sortOrder,
      isActive: d.isActive ?? true,
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
    },
  });

  await recordAudit(actor.id, "banner.update", "Banner", id);
  revalidatePath("/dashboard/banners");
  redirect("/dashboard/banners");
}

export async function deleteBanner(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";
  await prisma.banner.delete({ where: { id } });
  await recordAudit(actor.id, "banner.delete", "Banner", id);
  revalidatePath("/dashboard/banners");
}

/* ----------------------------------------------------------- locations */

const districtSchema = z.object({
  name: z.string().min(2, "Enter a destination name"),
  divisionId: z.string().min(1, "Choose a division"),
  tagline: z.string().max(120).optional(),
  imageUrl: z.string().optional(),
  isPopular: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

function parseDistrict(formData: FormData) {
  let imageUrl = formData.get("imageUrl")?.toString() ?? "";
  const uploaded = formData.get("images")?.toString();
  if (uploaded) {
    try {
      const list = JSON.parse(uploaded);
      if (Array.isArray(list) && list[0]?.url) imageUrl = list[0].url;
    } catch {
      /* keep the pasted value */
    }
  }
  return districtSchema.safeParse({
    name: formData.get("name"),
    divisionId: formData.get("divisionId"),
    tagline: formData.get("tagline") || undefined,
    imageUrl,
    isPopular: formData.get("isPopular") === "true",
    isActive: formData.get("isActive") === "true",
  });
}

export async function createDistrict(formData: FormData) {
  const actor = await requireAdminActor();
  const parsed = parseDistrict(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const slug = slugify(d.name);
  const clash = await prisma.district.findUnique({ where: { slug }, select: { id: true } });
  if (clash) throw new Error("A destination with that name already exists");

  const district = await prisma.district.create({
    data: {
      name: d.name,
      slug,
      divisionId: d.divisionId,
      tagline: d.tagline ?? null,
      imageUrl: d.imageUrl || null,
      isPopular: d.isPopular ?? false,
      isActive: d.isActive ?? true,
    },
    select: { id: true },
  });

  await recordAudit(actor.id, "district.create", "District", district.id, { name: d.name });
  revalidatePath("/dashboard/destinations");
  redirect("/dashboard/destinations");
}

export async function updateDistrict(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";
  const parsed = parseDistrict(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  await prisma.district.update({
    where: { id },
    data: {
      name: d.name,
      divisionId: d.divisionId,
      tagline: d.tagline ?? null,
      imageUrl: d.imageUrl || null,
      isPopular: d.isPopular ?? false,
      isActive: d.isActive ?? true,
    },
  });

  await recordAudit(actor.id, "district.update", "District", id);
  revalidatePath("/dashboard/destinations");
  redirect("/dashboard/destinations");
}

export async function deleteDistrict(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";

  const inUse = await prisma.property.count({ where: { districtId: id } });
  if (inUse > 0) {
    throw new Error(
      `${inUse} propert${inUse === 1 ? "y is" : "ies are"} listed in this destination. Reassign them first.`,
    );
  }

  await prisma.area.deleteMany({ where: { districtId: id } });
  await prisma.district.delete({ where: { id } });
  await recordAudit(actor.id, "district.delete", "District", id);
  revalidatePath("/dashboard/destinations");
}

/* ------------------------------------------------------------ amenities */

export async function createAmenity(formData: FormData) {
  const actor = await requireAdminActor();
  const parsed = z
    .object({
      name: z.string().min(2, "Enter an amenity name"),
      icon: z.string().optional(),
      category: z.string().optional(),
      isFilter: z.coerce.boolean().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      icon: formData.get("icon") || undefined,
      category: formData.get("category") || undefined,
      isFilter: formData.get("isFilter") === "true",
    });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const amenity = await prisma.amenity.create({
    data: {
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      icon: parsed.data.icon ?? null,
      category: parsed.data.category ?? null,
      isFilter: parsed.data.isFilter ?? false,
    },
    select: { id: true },
  });

  await recordAudit(actor.id, "amenity.create", "Amenity", amenity.id);
  revalidatePath("/dashboard/amenities");
  redirect("/dashboard/amenities");
}

export async function deleteAmenity(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";
  await prisma.amenity.delete({ where: { id } });
  await recordAudit(actor.id, "amenity.delete", "Amenity", id);
  revalidatePath("/dashboard/amenities");
}

/* ------------------------------------------------- vendor offer shortcut */

/** Vendors set a discount on their own rooms rather than platform coupons. */
export async function setRoomDiscount(formData: FormData) {
  const actor = await requireVendorActor();
  const parsed = z
    .object({
      roomId: z.string().min(1),
      discountValue: z.coerce.number().min(0).max(90),
    })
    .safeParse({
      roomId: formData.get("roomId"),
      discountValue: formData.get("discountValue") || 0,
    });
  if (!parsed.success) throw new Error("Discount must be between 0 and 90%");

  const room = await prisma.room.findFirst({
    where: { id: parsed.data.roomId, property: { vendorId: actor.vendorId } },
    select: { id: true },
  });
  if (!room) throw new Error("Forbidden");

  await prisma.room.update({
    where: { id: room.id },
    data: {
      discountType: parsed.data.discountValue ? "PERCENTAGE" : null,
      discountValue: parsed.data.discountValue || null,
    },
  });

  await recordAudit(actor.id, "room.discount", "Room", room.id, parsed.data);
  revalidatePath("/dashboard/offers");
}
