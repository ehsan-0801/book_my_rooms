"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAudit, requireAdminActor, requireVendorActor } from "@/lib/rbac";
import { revalidateDestinations } from "@/lib/revalidate";
import { fail, guard, ok, warn, type ActionResult } from "./result";

const slugify = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** Pulls a single uploaded image URL out of the uploader, else the plain field. */
function readSingleImage(formData: FormData, fallbackField: string) {
  const uploaded = formData.get("images")?.toString();
  if (uploaded) {
    try {
      const list = JSON.parse(uploaded);
      if (Array.isArray(list) && list[0]?.url) return String(list[0].url);
    } catch {
      /* fall through */
    }
  }
  return String(formData.get(fallbackField) ?? "");
}

function firstError(error: z.ZodError, fallback: string) {
  const errors = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const first = Object.values(errors).find((messages) => messages?.length);
  return { message: first?.[0] ?? fallback, errors };
}

/* ------------------------------------------------------------- coupons */

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Use at least 3 characters")
    .max(24)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  minSpend: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  startsAt: z.string().min(1, "Choose a start date"),
  endsAt: z.string().min(1, "Choose an end date"),
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

export async function createCoupon(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = parseCoupon(formData);
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the coupon details");
      return fail(message, errors);
    }
    const d = parsed.data;

    if (new Date(d.endsAt) <= new Date(d.startsAt)) {
      return fail("The end date must be after the start date", {
        endsAt: ["Must be after the start date"],
      });
    }
    if (d.type === "PERCENTAGE" && d.value > 100) {
      return fail("A percentage discount can't exceed 100%", {
        value: ["Maximum 100%"],
      });
    }

    const code = d.code.toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
    if (existing) {
      return fail(`${code} already exists`, { code: ["That code is taken"] });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
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

    await recordAudit(actor.id, "coupon.create", "Coupon", coupon.id, { code });
    revalidatePath("/dashboard/coupons");
    return ok(`${code} created`, "/dashboard/coupons");
  });
}

export async function updateCoupon(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = parseCoupon(formData);
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the coupon details");
      return fail(message, errors);
    }
    const d = parsed.data;

    if (new Date(d.endsAt) <= new Date(d.startsAt)) {
      return fail("The end date must be after the start date", {
        endsAt: ["Must be after the start date"],
      });
    }

    const code = d.code.toUpperCase();
    await prisma.coupon.update({
      where: { id },
      data: {
        code,
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

    await recordAudit(actor.id, "coupon.update", "Coupon", id, { code });
    revalidatePath("/dashboard/coupons");
    return ok(`${code} saved`, "/dashboard/coupons");
  });
}

export async function deleteCoupon(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { code: true, _count: { select: { bookings: true } } },
    });
    if (!coupon) return fail("That coupon no longer exists");
    if (coupon._count.bookings > 0) {
      return warn(
        `${coupon.code} is attached to ${coupon._count.bookings} booking${coupon._count.bookings === 1 ? "" : "s"} — pause it instead`,
      );
    }

    await prisma.coupon.delete({ where: { id } });
    await recordAudit(actor.id, "coupon.delete", "Coupon", id);
    revalidatePath("/dashboard/coupons");
    return ok(`${coupon.code} deleted`);
  });
}

export async function toggleCoupon(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const current = await prisma.coupon.findUnique({
      where: { id },
      select: { isActive: true, code: true },
    });
    if (!current) return fail("That coupon no longer exists");

    await prisma.coupon.update({ where: { id }, data: { isActive: !current.isActive } });
    await recordAudit(actor.id, "coupon.toggle", "Coupon", id);
    revalidatePath("/dashboard/coupons");
    return current.isActive
      ? warn(`${current.code} paused — it will be rejected at checkout`)
      : ok(`${current.code} is active`);
  });
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
  return bannerSchema.safeParse({
    title: formData.get("title"),
    imageUrl: readSingleImage(formData, "imageUrl"),
    linkUrl: formData.get("linkUrl") || undefined,
    position: formData.get("position") || "home_hero",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "true",
    startsAt: formData.get("startsAt") || undefined,
    endsAt: formData.get("endsAt") || undefined,
  });
}

export async function createBanner(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = parseBanner(formData);
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the banner details");
      return fail(message, errors);
    }
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
    revalidatePath("/");
    return ok(`"${d.title}" created`, "/dashboard/banners");
  });
}

export async function updateBanner(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = parseBanner(formData);
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the banner details");
      return fail(message, errors);
    }
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
    revalidatePath("/");
    return ok(`"${d.title}" saved`, "/dashboard/banners");
  });
}

export async function deleteBanner(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const banner = await prisma.banner.findUnique({
      where: { id },
      select: { title: true },
    });
    if (!banner) return fail("That banner no longer exists");

    await prisma.banner.delete({ where: { id } });
    await recordAudit(actor.id, "banner.delete", "Banner", id);
    revalidatePath("/dashboard/banners");
    revalidatePath("/");
    return ok(`"${banner.title}" deleted`);
  });
}

/* ----------------------------------------------------------- divisions */

export async function createDivision(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = z
      .object({ name: z.string().min(2, "Enter a division name") })
      .safeParse({ name: formData.get("name") });
    if (!parsed.success) return fail("Enter a division name");

    const slug = slugify(parsed.data.name);
    const clash = await prisma.division.findFirst({
      where: { OR: [{ name: parsed.data.name }, { slug }] },
      select: { id: true },
    });
    if (clash) return fail("That division already exists");

    const division = await prisma.division.create({
      data: { name: parsed.data.name, slug },
      select: { id: true },
    });
    await recordAudit(actor.id, "division.create", "Division", division.id);
    revalidatePath("/dashboard/destinations");
    return ok(`${parsed.data.name} added`);
  });
}

export async function updateDivision(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = z
      .object({ name: z.string().min(2, "Enter a division name") })
      .safeParse({ name: formData.get("name") });
    if (!parsed.success) return fail("Enter a division name");

    const slug = slugify(parsed.data.name);
    const clash = await prisma.division.findFirst({
      where: { NOT: { id }, OR: [{ name: parsed.data.name }, { slug }] },
      select: { id: true },
    });
    if (clash) return fail("Another division already uses that name");

    await prisma.division.update({
      where: { id },
      data: { name: parsed.data.name, slug },
    });
    await recordAudit(actor.id, "division.update", "Division", id);
    revalidatePath("/dashboard/destinations");
    return ok(`${parsed.data.name} saved`);
  });
}

export async function deleteDivision(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const division = await prisma.division.findUnique({
      where: { id },
      select: { name: true, _count: { select: { districts: true } } },
    });
    if (!division) return fail("That division no longer exists");
    if (division._count.districts > 0) {
      return warn(
        `${division.name} still has ${division._count.districts} destination${division._count.districts === 1 ? "" : "s"} — move them first`,
      );
    }

    await prisma.division.delete({ where: { id } });
    await recordAudit(actor.id, "division.delete", "Division", id);
    revalidatePath("/dashboard/destinations");
    return ok(`${division.name} deleted`);
  });
}

/* --------------------------------------------------- destinations (districts) */

const districtSchema = z.object({
  name: z.string().min(2, "Enter a destination name"),
  divisionId: z.string().min(1, "Choose a division"),
  tagline: z.string().max(120).optional(),
  imageUrl: z.string().optional(),
  isPopular: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

function parseDistrict(formData: FormData) {
  return districtSchema.safeParse({
    name: formData.get("name"),
    divisionId: formData.get("divisionId"),
    tagline: formData.get("tagline") || undefined,
    imageUrl: readSingleImage(formData, "imageUrl"),
    isPopular: formData.get("isPopular") === "true",
    isActive: formData.get("isActive") === "true",
  });
}

export async function createDistrict(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = parseDistrict(formData);
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the destination details");
      return fail(message, errors);
    }
    const d = parsed.data;

    const slug = slugify(d.name);
    const clash = await prisma.district.findUnique({ where: { slug }, select: { id: true } });
    if (clash) {
      return fail("A destination with that name already exists", {
        name: ["That name is taken"],
      });
    }

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
    revalidateDestinations(slug);
    return ok(`${d.name} added`, "/dashboard/destinations");
  });
}

export async function updateDistrict(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = parseDistrict(formData);
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the destination details");
      return fail(message, errors);
    }
    const d = parsed.data;

    const updated = await prisma.district.update({
      where: { id },
      data: {
        name: d.name,
        divisionId: d.divisionId,
        tagline: d.tagline ?? null,
        imageUrl: d.imageUrl || null,
        isPopular: d.isPopular ?? false,
        isActive: d.isActive ?? true,
      },
      select: { slug: true },
    });

    await recordAudit(actor.id, "district.update", "District", id);
    revalidatePath("/dashboard/destinations");
    revalidateDestinations(updated.slug);
    return ok(`${d.name} saved`, "/dashboard/destinations");
  });
}

export async function deleteDistrict(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");

    const district = await prisma.district.findUnique({
      where: { id },
      select: { name: true, slug: true, _count: { select: { properties: true } } },
    });
    if (!district) return fail("That destination no longer exists");
    if (district._count.properties > 0) {
      return warn(
        `${district._count.properties} propert${district._count.properties === 1 ? "y is" : "ies are"} listed in ${district.name} — reassign them first`,
      );
    }

    await prisma.area.deleteMany({ where: { districtId: id } });
    await prisma.district.delete({ where: { id } });
    await recordAudit(actor.id, "district.delete", "District", id);
    revalidatePath("/dashboard/destinations");
    revalidateDestinations(district.slug);
    return ok(`${district.name} deleted`);
  });
}

/* ---------------------------------------------------------------- areas */

export async function createArea(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = z
      .object({
        districtId: z.string().min(1, "Choose a destination"),
        name: z.string().min(2, "Enter an area name"),
      })
      .safeParse({
        districtId: formData.get("districtId"),
        name: formData.get("name"),
      });
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the area details");
      return fail(message, errors);
    }

    const slug = slugify(parsed.data.name);
    const clash = await prisma.area.findUnique({
      where: { districtId_slug: { districtId: parsed.data.districtId, slug } },
      select: { id: true },
    });
    if (clash) return fail("That area already exists in this destination");

    const area = await prisma.area.create({
      data: { districtId: parsed.data.districtId, name: parsed.data.name, slug },
      select: { id: true },
    });
    await recordAudit(actor.id, "area.create", "Area", area.id);
    revalidatePath("/dashboard/areas");
    return ok(`${parsed.data.name} added`);
  });
}

export async function updateArea(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = z
      .object({
        id: z.string().min(1),
        name: z.string().min(2, "Enter an area name"),
        isActive: z.coerce.boolean().optional(),
      })
      .safeParse({
        id: formData.get("id"),
        name: formData.get("name"),
        isActive: formData.get("isActive") === "true",
      });
    if (!parsed.success) return fail("Enter an area name");

    await prisma.area.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        slug: slugify(parsed.data.name),
        isActive: parsed.data.isActive ?? true,
      },
    });
    await recordAudit(actor.id, "area.update", "Area", parsed.data.id);
    revalidatePath("/dashboard/areas");
    return ok(`${parsed.data.name} saved`);
  });
}

export async function deleteArea(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const area = await prisma.area.findUnique({
      where: { id },
      select: { name: true, _count: { select: { properties: true } } },
    });
    if (!area) return fail("That area no longer exists");
    if (area._count.properties > 0) {
      return warn(
        `${area._count.properties} propert${area._count.properties === 1 ? "y is" : "ies are"} in ${area.name} — reassign them first`,
      );
    }

    await prisma.area.delete({ where: { id } });
    await recordAudit(actor.id, "area.delete", "Area", id);
    revalidatePath("/dashboard/areas");
    return ok(`${area.name} deleted`);
  });
}

/* -------------------------------------------------- property types (SRS §7.1) */

const propertyTypeSchema = z.object({
  name: z.string().min(2, "Enter a type name"),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).max(99),
  isActive: z.coerce.boolean().optional(),
});

export async function createPropertyType(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = propertyTypeSchema.safeParse({
      name: formData.get("name"),
      icon: formData.get("icon") || undefined,
      sortOrder: formData.get("sortOrder") || 0,
      isActive: formData.get("isActive") === "true",
    });
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the type details");
      return fail(message, errors);
    }

    const slug = slugify(parsed.data.name);
    const clash = await prisma.propertyType.findUnique({ where: { slug }, select: { id: true } });
    if (clash) return fail("That property type already exists");

    const type = await prisma.propertyType.create({
      data: {
        name: parsed.data.name,
        slug,
        icon: parsed.data.icon ?? null,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive ?? true,
      },
      select: { id: true },
    });
    await recordAudit(actor.id, "propertyType.create", "PropertyType", type.id);
    revalidatePath("/dashboard/property-types");
    revalidatePath("/");
    return ok(`${parsed.data.name} added`, "/dashboard/property-types");
  });
}

export async function updatePropertyType(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = propertyTypeSchema.safeParse({
      name: formData.get("name"),
      icon: formData.get("icon") || undefined,
      sortOrder: formData.get("sortOrder") || 0,
      isActive: formData.get("isActive") === "true",
    });
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the type details");
      return fail(message, errors);
    }

    await prisma.propertyType.update({
      where: { id },
      data: {
        name: parsed.data.name,
        icon: parsed.data.icon ?? null,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive ?? true,
      },
    });
    await recordAudit(actor.id, "propertyType.update", "PropertyType", id);
    revalidatePath("/dashboard/property-types");
    revalidatePath("/");
    return ok(`${parsed.data.name} saved`, "/dashboard/property-types");
  });
}

export async function deletePropertyType(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const type = await prisma.propertyType.findUnique({
      where: { id },
      select: { name: true, _count: { select: { properties: true } } },
    });
    if (!type) return fail("That property type no longer exists");
    if (type._count.properties > 0) {
      return warn(
        `${type._count.properties} propert${type._count.properties === 1 ? "y uses" : "ies use"} ${type.name} — reassign them first`,
      );
    }

    await prisma.propertyType.delete({ where: { id } });
    await recordAudit(actor.id, "propertyType.delete", "PropertyType", id);
    revalidatePath("/dashboard/property-types");
    return ok(`${type.name} deleted`);
  });
}

/* ------------------------------------------------------------ amenities */

const amenitySchema = z.object({
  name: z.string().min(2, "Enter an amenity name"),
  icon: z.string().optional(),
  category: z.string().optional(),
  isFilter: z.coerce.boolean().optional(),
});

export async function createAmenity(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = amenitySchema.safeParse({
      name: formData.get("name"),
      icon: formData.get("icon") || undefined,
      category: formData.get("category") || undefined,
      isFilter: formData.get("isFilter") === "true",
    });
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the amenity details");
      return fail(message, errors);
    }

    const slug = slugify(parsed.data.name);
    const clash = await prisma.amenity.findUnique({ where: { slug }, select: { id: true } });
    if (clash) return fail("That amenity already exists");

    const amenity = await prisma.amenity.create({
      data: {
        name: parsed.data.name,
        slug,
        icon: parsed.data.icon ?? null,
        category: parsed.data.category ?? null,
        isFilter: parsed.data.isFilter ?? false,
      },
      select: { id: true },
    });

    await recordAudit(actor.id, "amenity.create", "Amenity", amenity.id);
    revalidatePath("/dashboard/amenities");
    return ok(`${parsed.data.name} added`, "/dashboard/amenities");
  });
}

export async function updateAmenity(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = amenitySchema.safeParse({
      name: formData.get("name"),
      icon: formData.get("icon") || undefined,
      category: formData.get("category") || undefined,
      isFilter: formData.get("isFilter") === "true",
    });
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the amenity details");
      return fail(message, errors);
    }

    await prisma.amenity.update({
      where: { id },
      data: {
        name: parsed.data.name,
        icon: parsed.data.icon ?? null,
        category: parsed.data.category ?? null,
        isFilter: parsed.data.isFilter ?? false,
      },
    });

    await recordAudit(actor.id, "amenity.update", "Amenity", id);
    revalidatePath("/dashboard/amenities");
    return ok(`${parsed.data.name} saved`, "/dashboard/amenities");
  });
}

export async function deleteAmenity(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const amenity = await prisma.amenity.findUnique({
      where: { id },
      select: { name: true, _count: { select: { properties: true, rooms: true } } },
    });
    if (!amenity) return fail("That amenity no longer exists");

    const uses = amenity._count.properties + amenity._count.rooms;
    await prisma.amenity.delete({ where: { id } });
    await recordAudit(actor.id, "amenity.delete", "Amenity", id);
    revalidatePath("/dashboard/amenities");

    return uses > 0
      ? warn(`${amenity.name} deleted and removed from ${uses} listing${uses === 1 ? "" : "s"}`)
      : ok(`${amenity.name} deleted`);
  });
}

/* ------------------------------------------------------ content pages (§59) */

const pageSchema = z.object({
  slug: z
    .string()
    .min(2, "Enter a URL slug")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  title: z.string().min(2, "Enter a title"),
  body: z.string().min(10, "Write some content"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
});

function parsePage(formData: FormData) {
  return pageSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    body: formData.get("body"),
    metaTitle: formData.get("metaTitle") || undefined,
    metaDescription: formData.get("metaDescription") || undefined,
    isPublished: formData.get("isPublished") === "true",
  });
}

export async function createContentPage(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const parsed = parsePage(formData);
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the page details");
      return fail(message, errors);
    }

    const clash = await prisma.contentPage.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });
    if (clash) return fail(`/${parsed.data.slug} already exists`, { slug: ["Slug is taken"] });

    const page = await prisma.contentPage.create({
      data: {
        slug: parsed.data.slug,
        title: parsed.data.title,
        body: parsed.data.body,
        metaTitle: parsed.data.metaTitle ?? null,
        metaDescription: parsed.data.metaDescription ?? null,
        isPublished: parsed.data.isPublished ?? false,
      },
      select: { id: true },
    });

    await recordAudit(actor.id, "page.create", "ContentPage", page.id);
    revalidatePath("/dashboard/pages");
    return ok(`${parsed.data.title} created`, "/dashboard/pages");
  });
}

export async function updateContentPage(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = parsePage(formData);
    if (!parsed.success) {
      const { message, errors } = firstError(parsed.error, "Check the page details");
      return fail(message, errors);
    }

    await prisma.contentPage.update({
      where: { id },
      data: {
        slug: parsed.data.slug,
        title: parsed.data.title,
        body: parsed.data.body,
        metaTitle: parsed.data.metaTitle ?? null,
        metaDescription: parsed.data.metaDescription ?? null,
        isPublished: parsed.data.isPublished ?? false,
      },
    });

    await recordAudit(actor.id, "page.update", "ContentPage", id);
    revalidatePath("/dashboard/pages");
    revalidatePath(`/${parsed.data.slug}`);
    return ok(`${parsed.data.title} saved`, "/dashboard/pages");
  });
}

export async function deleteContentPage(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const page = await prisma.contentPage.findUnique({
      where: { id },
      select: { title: true },
    });
    if (!page) return fail("That page no longer exists");

    await prisma.contentPage.delete({ where: { id } });
    await recordAudit(actor.id, "page.delete", "ContentPage", id);
    revalidatePath("/dashboard/pages");
    return ok(`${page.title} deleted`);
  });
}

/* ------------------------------------------------- vendor offer shortcut */

/** Vendors set a discount on their own rooms rather than platform coupons. */
export async function setRoomDiscount(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
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
    if (!parsed.success) return fail("Discount must be between 0 and 90%");

    const room = await prisma.room.findFirst({
      where: { id: parsed.data.roomId, property: { vendorId: actor.vendorId } },
      select: { id: true, name: true },
    });
    if (!room) return warn("You don't have access to that room");

    await prisma.room.update({
      where: { id: room.id },
      data: {
        discountType: parsed.data.discountValue ? "PERCENTAGE" : null,
        discountValue: parsed.data.discountValue || null,
      },
    });

    await recordAudit(actor.id, "room.discount", "Room", room.id, parsed.data);
    revalidatePath("/dashboard/offers");
    revalidatePath("/offers");

    return parsed.data.discountValue
      ? ok(`${room.name} — ${parsed.data.discountValue}% off applied`)
      : ok(`${room.name} discount removed`);
  });
}
