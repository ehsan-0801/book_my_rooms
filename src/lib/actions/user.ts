"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { recordAudit, requireActor, requireAdminActor } from "@/lib/rbac";

export async function updateOwnProfile(formData: FormData) {
  const actor = await requireActor();
  const parsed = z
    .object({
      name: z.string().min(2, "Enter your name"),
      phone: z.string().regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi number"),
      avatarUrl: z.string().url().optional().or(z.literal("")),
    })
    .safeParse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      avatarUrl: (() => {
        const uploaded = formData.get("images")?.toString();
        if (uploaded) {
          try {
            const list = JSON.parse(uploaded);
            if (Array.isArray(list) && list[0]?.url) return list[0].url;
          } catch {
            /* fall through */
          }
        }
        return formData.get("avatarUrl") ?? "";
      })(),
    });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  // Phone is unique — surface a clear message instead of a Prisma error.
  const clash = await prisma.user.findFirst({
    where: { phone: parsed.data.phone, NOT: { id: actor.id } },
    select: { id: true },
  });
  if (clash) throw new Error("Another account already uses that mobile number");

  await prisma.user.update({
    where: { id: actor.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      avatarUrl: parsed.data.avatarUrl || null,
    },
  });

  revalidatePath("/dashboard/settings");
}

export async function changeOwnPassword(formData: FormData) {
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
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: actor.id },
    select: { passwordHash: true },
  });
  if (!user.passwordHash) throw new Error("This account has no password set");

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) throw new Error("Your current password is incorrect");

  await prisma.user.update({
    where: { id: actor.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });

  await recordAudit(actor.id, "user.changePassword", "User", actor.id);
  revalidatePath("/dashboard/settings");
}

export async function updateVendorProfile(formData: FormData) {
  const actor = await requireActor();
  if (actor.role !== "VENDOR" || !actor.vendorId) throw new Error("Forbidden");

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
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

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
}

/* ------------------------------------------------------- admin: customers */

export async function deleteUser(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";

  if (id === actor.id) throw new Error("You can't delete your own account");

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, _count: { select: { bookings: true } } },
  });
  if (!target) throw new Error("That user no longer exists");
  if (target.role === "ADMIN") throw new Error("Admin accounts can't be deleted here");

  // Bookings are financial records — deactivate rather than destroy history.
  if (target._count.bookings > 0) {
    throw new Error(
      `This customer has ${target._count.bookings} booking${target._count.bookings === 1 ? "" : "s"}. Deactivate the account instead.`,
    );
  }

  await prisma.user.delete({ where: { id } });
  await recordAudit(actor.id, "user.delete", "User", id);
  revalidatePath("/dashboard/customers");
}

export async function deleteVendor(formData: FormData) {
  const actor = await requireAdminActor();
  const id = formData.get("id")?.toString() ?? "";

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    select: { userId: true, _count: { select: { properties: true } } },
  });
  if (!vendor) throw new Error("That vendor no longer exists");
  if (vendor._count.properties > 0) {
    throw new Error(
      `This vendor still has ${vendor._count.properties} propert${vendor._count.properties === 1 ? "y" : "ies"}. Remove them first.`,
    );
  }

  await prisma.vendor.delete({ where: { id } });
  await recordAudit(actor.id, "vendor.delete", "Vendor", id);
  revalidatePath("/dashboard/vendors");
}
