"use client";

import { CouponForm } from "@/components/dashboard/coupon-form";
import { FormShell } from "@/components/dashboard/form";
import { updateCoupon } from "@/lib/actions/catalog";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"coupons/detail">;

export function EditCouponClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/coupons/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditCouponView data={data} />;
}

function EditCouponView({ data: coupon }: { data: ViewData }) {

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

