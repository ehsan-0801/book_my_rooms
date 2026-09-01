import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/dashboard/action-form";
import {
  FormActions,
  FormSection,
  FormShell,
  TextField,
} from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { updateVendorAsAdmin } from "@/lib/actions/user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit vendor", robots: { index: false } };

export default async function EditVendorPage({
  params,
}: PageProps<"/dashboard/vendors/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();

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
