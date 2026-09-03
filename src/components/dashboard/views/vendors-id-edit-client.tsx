"use client";

import { ActionForm } from "@/components/dashboard/action-form";
import {
  FormActions,
  FormSection,
  FormShell,
  TextField,
} from "@/components/dashboard/form";
import { updateVendorAsAdmin } from "@/lib/actions/user";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"vendors/detail">;

export function EditVendorClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/vendors/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditVendorView data={data} />;
}

function EditVendorView({ data }: { data: ViewData }) {
  const vendor = data.vendor;

  return (
    <FormShell
      title={`Edit ${vendor.businessName}`}
      description="Business details and the commission rate applied to new bookings."
      backHref={`/dashboard/vendors/${vendor.id}`}
      backLabel="Back to vendor"
    >
      <ActionForm action={updateVendorAsAdmin} className="space-y-6">
        <input type="hidden" name="id" value={vendor.id} />

        <FormSection title="Business">
          <TextField
            label="Business name"
            name="businessName"
            required
            defaultValue={vendor.businessName}
          />
          <TextField
            label="Commission rate (%)"
            name="commissionRate"
            type="number"
            min={0}
            max={50}
            step={0.5}
            required
            defaultValue={Number(vendor.commissionRate ?? 15)}
            hint="Applied to bookings made from now on."
          />
          <TextField
            label="Contact email"
            name="contactEmail"
            type="email"
            required
            defaultValue={vendor.contactEmail}
          />
          <TextField
            label="Contact phone"
            name="contactPhone"
            type="tel"
            required
            defaultValue={vendor.contactPhone}
          />
          <TextField
            label="Business address"
            name="address"
            full
            defaultValue={vendor.address ?? ""}
          />
        </FormSection>

        <FormSection title="Compliance & banking">
          <TextField
            label="Trade licence number"
            name="tradeLicenseNo"
            defaultValue={vendor.tradeLicenseNo ?? ""}
          />
          <TextField label="TIN" name="tinNumber" defaultValue={vendor.tinNumber ?? ""} />
          <TextField label="Bank name" name="bankName" defaultValue={vendor.bankName ?? ""} />
          <TextField
            label="Account name"
            name="bankAccountName"
            defaultValue={vendor.bankAccountName ?? ""}
          />
          <TextField
            label="Account number"
            name="bankAccountNo"
            defaultValue={vendor.bankAccountNo ?? ""}
          />
        </FormSection>

        <FormActions submitLabel="Save changes" cancelHref={`/dashboard/vendors/${vendor.id}`} />
      </ActionForm>
    </FormShell>
  );
}

