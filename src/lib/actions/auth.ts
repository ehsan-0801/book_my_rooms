"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ActionState =
  | { error?: string; fieldErrors?: Record<string, string[] | undefined> }
  | undefined;

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    // A successful signIn throws a redirect — only AuthError is a real failure.
    if (error instanceof AuthError) {
      return { error: "Those details don't match an account." };
    }
    throw error;
  }
}

const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[a-zA-Z]/, "Include at least one letter")
      .regex(/\d/, "Include at least one number"),
    role: z.enum(["CUSTOMER", "VENDOR"]),
    businessName: z.string().optional(),
  })
  .refine((d) => d.role !== "VENDOR" || (d.businessName?.trim().length ?? 0) >= 2, {
    message: "Enter your business or property name",
    path: ["businessName"],
  });

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role") ?? "CUSTOMER",
    businessName: formData.get("businessName"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { name, email, phone, password, role, businessName } = parsed.data;
  const normalisedEmail = email.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: normalisedEmail }, { phone }] },
    select: { email: true, phone: true },
  });
  if (existing) {
    return {
      fieldErrors:
        existing.email === normalisedEmail
          ? { email: ["An account already uses this email address"] }
          : { phone: ["An account already uses this mobile number"] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const slugBase = (businessName ?? name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  await prisma.user.create({
    data: {
      name,
      email: normalisedEmail,
      phone,
      passwordHash,
      role,
      // Vendors sign up PENDING — they cannot list until an admin approves
      // them (SRS §4.2).
      vendor:
        role === "VENDOR"
          ? {
              create: {
                businessName: businessName!,
                slug: `${slugBase}-${Date.now().toString(36)}`,
                contactEmail: normalisedEmail,
                contactPhone: phone,
                status: "PENDING",
              },
            }
          : undefined,
    },
  });

  try {
    await signIn("credentials", {
      email: normalisedEmail,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try logging in." };
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
