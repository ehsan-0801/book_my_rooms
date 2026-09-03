"use client";

import { CouponForm } from "@/components/dashboard/coupon-form";
import { FormShell } from "@/components/dashboard/form";
import { createCoupon } from "@/lib/actions/catalog";

export function NewCouponClient() {
  return (
    <FormShell
      title="New coupon"
      description="Travellers enter this code at checkout."
      backHref="/dashboard/coupons"
      backLabel="Back to coupons"
    >
      <CouponForm action={createCoupon} submitLabel="Create coupon" />
    </FormShell>
  );
}
