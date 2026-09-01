import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CouponForm } from "@/components/dashboard/coupon-form";
import { FormShell } from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { updateCoupon } from "@/lib/actions/catalog";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit coupon", robots: { index: false } };

export default async function EditCouponPage({
  params,
}: PageProps<"/dashboard/coupons/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <FormShell
      title={`Edit ${coupon.code}`}
      backHref="/dashboard/coupons"
      backLabel="Back to coupons"
    >
      <CouponForm
        action={updateCoupon}
        submitLabel="Save changes"
        coupon={{
          ...coupon,
          value: Number(coupon.value),
          maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
          minSpend: coupon.minSpend ? Number(coupon.minSpend) : null,
        }}
      />
    </FormShell>
  );
}
