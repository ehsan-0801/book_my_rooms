"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAudit, requireActor, requireAdminActor } from "@/lib/rbac";
import { fail, guard, ok, warn, type ActionResult } from "./result";

/** Pulls an uploaded image URL out of the uploader's JSON, else the plain field. */
function readSingleImage(formData: FormData, fallbackField: string) {
  const uploaded = formData.get("images")?.toString();
  if (uploaded) {
    try {
      const list = JSON.parse(uploaded);
      if (Array.isArray(list) && list[0]?.url) return String(list[0].url);
    } catch {
      /* fall through to the plain field */
    }
  }
  return String(formData.get(fallbackField) ?? "");
}

export async function updateOwnProfile(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireActor();
    const parsed = z
      .object({
        name: z.string().min(2, "Enter your name"),
        phone: z
          .string()
          .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
        avatarUrl: z.string().url().optional().or(z.literal("")),
      })
      .safeParse({
        name: formData.get("name"),
        phone: formData.get("phone"),
        avatarUrl: readSingleImage(formData, "avatarUrl"),
      });
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check your details", errors);
    }

    // Phone is unique — surface a clear message instead of a Prisma error.
    const clash = await prisma.user.findFirst({
      where: { phone: parsed.data.phone, NOT: { id: actor.id } },
      select: { id: true },
    });
    if (clash) {
      return fail("Another account already uses that mobile number", {
        phone: ["Already in use"],
      });
    }

    await prisma.user.update({
      where: { id: actor.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        avatarUrl: parsed.data.avatarUrl || null,
      },
    });

    revalidatePath("/dashboard/settings");
    return ok("Profile saved");
  });
}

export async function changeOwnPassword(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireActor();
    const parsed = z
      .object({
        currentPassword: z.string().min(1, "Enter your current password"),
        newPassword: z
          .string()
          .min(8, "Use at least 8 characters")
          .regex(/[a-zA-Z]/, "Include a letter")
          .regex(/\d/, "Include a number"),
        confirmPassword: z.string(),
      })
      .refine((d) => d.newPassword === d.confirmPassword, {
        message: "The new passwords don't match",
        path: ["confirmPassword"],
      })
      .safeParse({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
        confirmPassword: formData.get("confirmPassword"),
      });
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check your password", errors);
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { passwordHash: true },
    });
    if (!user.passwordHash) return warn("This account has no password set");

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!matches) {
      return fail("Your current password is incorrect", {
        currentPassword: ["Incorrect password"],
      });
    }

    await prisma.user.update({
      where: { id: actor.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
    });

    await recordAudit(actor.id, "user.changePassword", "User", actor.id);
    revalidatePath("/dashboard/settings");
    return ok("Password changed");
  });
}

export async function updateVendorProfile(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const actor = await requireActor();
    if (actor.role !== "VENDOR" || !actor.vendorId) {
      return warn("Only vendors can edit business details");
    }

    const parsed = z
      .object({
        businessName: z.string().min(2, "Enter your business name"),
        contactEmail: z.string().email("Enter a valid email"),
        contactPhone: z.string().min(6, "Enter a contact number"),
        address: z.string().optional(),
        tradeLicenseNo: z.string().optional(),
        tinNumber: z.string().optional(),
        bankName: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankAccountNo: z.string().optional(),
      })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check your details", errors);
    }

    await prisma.vendor.update({
      where: { id: actor.vendorId },
      data: {
        businessName: parsed.data.businessName,
        contactEmail: parsed.data.contactEmail,
        contactPhone: parsed.data.contactPhone,
        address: parsed.data.address || null,
        tradeLicenseNo: parsed.data.tradeLicenseNo || null,
        tinNumber: parsed.data.tinNumber || null,
        bankName: parsed.data.bankName || null,
        bankAccountName: parsed.data.bankAccountName || null,
        bankAccountNo: parsed.data.bankAccountNo || null,
      },
    });

    revalidatePath("/dashboard/settings");
    return ok("Business details saved");
  });
}

/* ------------------------------------------------------- admin: accounts */

export async function updateCustomer(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = z
      .object({
        name: z.string().min(2, "Enter a name"),
        email: z.string().email("Enter a valid email"),
        phone: z
          .string()
          .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
        isActive: z.coerce.boolean().optional(),
      })
      .safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        isActive: formData.get("isActive") === "true",
      });
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check the details", errors);
    }

    const clash = await prisma.user.findFirst({
      where: {
        NOT: { id },
        OR: [
          { email: parsed.data.email.toLowerCase() },
          { phone: parsed.data.phone },
        ],
      },
      select: { email: true },
    });
    if (clash) {
      return fail("Another account already uses that email or mobile number");
    }

    await prisma.user.update({
      where: { id },
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone,
        isActive: parsed.data.isActive ?? true,
      },
    });

    await recordAudit(admin.id, "customer.update", "User", id);
    revalidatePath("/dashboard/customers");
    return ok(`${parsed.data.name} updated`, "/dashboard/customers");
  });
}

export async function updateVendorAsAdmin(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = z
      .object({
        businessName: z.string().min(2, "Enter the business name"),
        contactEmail: z.string().email("Enter a valid email"),
        contactPhone: z.string().min(6, "Enter a contact number"),
        commissionRate: z.coerce.number().min(0).max(50),
        address: z.string().optional(),
        tradeLicenseNo: z.string().optional(),
        tinNumber: z.string().optional(),
        bankName: z.string().optional(),
        bankAccountName: z.string().optional(),
        bankAccountNo: z.string().optional(),
      })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check the details", errors);
    }

    await prisma.vendor.update({
      where: { id },
      data: {
        businessName: parsed.data.businessName,
        contactEmail: parsed.data.contactEmail,
        contactPhone: parsed.data.contactPhone,
        commissionRate: parsed.data.commissionRate,
        address: parsed.data.address || null,
        tradeLicenseNo: parsed.data.tradeLicenseNo || null,
        tinNumber: parsed.data.tinNumber || null,
        bankName: parsed.data.bankName || null,
        bankAccountName: parsed.data.bankAccountName || null,
        bankAccountNo: parsed.data.bankAccountNo || null,
      },
    });

    await recordAudit(admin.id, "vendor.update", "Vendor", id);
    revalidatePath("/dashboard/vendors");
    return ok(`${parsed.data.businessName} updated`, `/dashboard/vendors/${id}`);
  });
}

export async function deleteUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");

    if (id === admin.id) return warn("You can't delete your own account");

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        role: true,
        _count: { select: { bookings: true } },
        vendor: { select: { businessName: true, _count: { select: { properties: true } } } },
      },
    });
    if (!target) return fail("That user no longer exists");

    // Deleting the last admin would leave nobody able to administer the
    // platform, with no way to undo it from inside the app.
    if (target.role === "ADMIN" && (await otherActiveAdmins(id)) === 0) {
      return warn("This is the last active admin — promote someone else first");
    }

    // A vendor row cascades from the user, so deleting the account would take
    // the business and its listings with it without ever saying so.
    if (target.vendor && target.vendor._count.properties > 0) {
      const n = target.vendor._count.properties;
      return warn(
        `${target.vendor.businessName} still has ${n} propert${n === 1 ? "y" : "ies"} — remove those first`,
      );
    }

    // Bookings are financial records — deactivate rather than destroy history.
    if (target._count.bookings > 0) {
      return warn(
        `${target.name} has ${target._count.bookings} booking${target._count.bookings === 1 ? "" : "s"} — deactivate the account instead`,
      );
    }

    await prisma.user.delete({ where: { id } });
    await recordAudit(admin.id, "user.delete", "User", id);
    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/users");
    return ok(`${target.name} deleted`);
  });
}

export async function deleteVendor(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { businessName: true, _count: { select: { properties: true } } },
    });
    if (!vendor) return fail("That vendor no longer exists");
    if (vendor._count.properties > 0) {
      return warn(
        `${vendor.businessName} still has ${vendor._count.properties} propert${vendor._count.properties === 1 ? "y" : "ies"} — remove those first`,
      );
    }

    await prisma.vendor.delete({ where: { id } });
    await recordAudit(admin.id, "vendor.delete", "Vendor", id);
    revalidatePath("/dashboard/vendors");
    return ok(`${vendor.businessName} deleted`);
  });
}

/* ------------------------------------------------------------ user management */

/**
 * How many admins would still be able to sign in without this one.
 *
 * Every guard below leans on this: the platform must never end up with no way
 * back in, so the last active admin can't be deleted, deactivated, or demoted
 * — not even by themselves.
 */
async function otherActiveAdmins(excludeId: string) {
  return prisma.user.count({
    where: { role: "ADMIN", isActive: true, NOT: { id: excludeId } },
  });
}

const userSchema = z.object({
  name: z.string().min(2, "Enter a name"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
  role: z.enum(["ADMIN", "VENDOR", "CUSTOMER"]),
  isActive: z.coerce.boolean().optional(),
});

function readUser(formData: FormData) {
  return userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "true",
  });
}

export async function createUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const parsed = readUser(formData);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check the details", errors);
    }
    const d = parsed.data;

    const password = String(formData.get("password") ?? "");
    if (password.length < 8) {
      return fail("The password must be at least 8 characters", {
        password: ["At least 8 characters"],
      });
    }

    // A vendor account is a business, not just a login — it needs a name to
    // trade under before it can be approved.
    const businessName = String(formData.get("businessName") ?? "").trim();
    if (d.role === "VENDOR" && businessName.length < 2) {
      return fail("Enter the business name for this vendor", {
        businessName: ["Enter the business name"],
      });
    }

    const email = d.email.toLowerCase();
    const clash = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone: d.phone }] },
      select: { id: true },
    });
    if (clash) return fail("An account already uses that email or mobile number");

    const slugBase = (businessName || d.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const user = await prisma.user.create({
      data: {
        name: d.name,
        email,
        phone: d.phone,
        passwordHash: await bcrypt.hash(password, 10),
        role: d.role,
        isActive: d.isActive ?? true,
        vendor:
          d.role === "VENDOR"
            ? {
                create: {
                  businessName,
                  slug: `${slugBase}-${Date.now().toString(36)}`,
                  contactEmail: email,
                  contactPhone: d.phone,
                  status: "PENDING",
                },
              }
            : undefined,
      },
      select: { id: true },
    });

    await recordAudit(admin.id, "user.create", "User", user.id);
    revalidatePath("/dashboard/users");
    return ok(`${d.name} added`, "/dashboard/users");
  });
}

export async function updateUser(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const parsed = readUser(formData);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      return fail(Object.values(errors)[0]?.[0] ?? "Check the details", errors);
    }
    const d = parsed.data;

    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true, isActive: true, vendor: { select: { id: true } } },
    });
    if (!target) return fail("That user no longer exists");

    const losingAdmin =
      target.role === "ADMIN" && (d.role !== "ADMIN" || d.isActive === false);
    if (losingAdmin && (await otherActiveAdmins(id)) === 0) {
      return warn("This is the last active admin — promote someone else first");
    }

    // Moving an existing account into VENDOR needs a business behind it, and
    // there's no sensible way to invent one here.
    if (d.role === "VENDOR" && !target.vendor) {
      return warn(
        "This account has no vendor profile — create the vendor through registration instead",
      );
    }

    const email = d.email.toLowerCase();
    const clash = await prisma.user.findFirst({
      where: { NOT: { id }, OR: [{ email }, { phone: d.phone }] },
      select: { id: true },
    });
    if (clash) return fail("Another account already uses that email or mobile number");

    await prisma.user.update({
      where: { id },
      data: {
        name: d.name,
        email,
        phone: d.phone,
        role: d.role,
        isActive: d.isActive ?? true,
      },
    });

    await recordAudit(admin.id, "user.update", "User", id);
    revalidatePath("/dashboard/users");
    return ok(`${d.name} updated`, "/dashboard/users");
  });
}

export async function setUserActive(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const active = formData.get("active") === "true";

    if (id === admin.id && !active) return warn("You can't deactivate your own account");

    const target = await prisma.user.findUnique({
      where: { id },
      select: { name: true, role: true },
    });
    if (!target) return fail("That user no longer exists");

    if (!active && target.role === "ADMIN" && (await otherActiveAdmins(id)) === 0) {
      return warn("This is the last active admin — promote someone else first");
    }

    await prisma.user.update({ where: { id }, data: { isActive: active } });
    await recordAudit(admin.id, active ? "user.activate" : "user.deactivate", "User", id);
    revalidatePath("/dashboard/users");
    return ok(`${target.name} ${active ? "reactivated" : "deactivated"}`);
  });
}

export async function resetUserPassword(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return guard(async () => {
    const admin = await requireAdminActor();
    const id = String(formData.get("id") ?? "");
    const password = String(formData.get("newPassword") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      return fail("The password must be at least 8 characters", {
        newPassword: ["At least 8 characters"],
      });
    }
    if (password !== confirm) {
      return fail("The passwords don't match", { confirmPassword: ["Doesn't match"] });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!target) return fail("That user no longer exists");

    await prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });

    await recordAudit(admin.id, "user.password-reset", "User", id);
    return ok(`${target.name}'s password was reset`);
  });
}
