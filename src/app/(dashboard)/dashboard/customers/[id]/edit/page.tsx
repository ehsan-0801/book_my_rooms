import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/dashboard/action-form";
import {
  CheckboxField,
  FormActions,
  FormSection,
  FormShell,
  TextField,
} from "@/components/dashboard/form";
import { requireAdmin } from "@/lib/auth-guards";
import { updateCustomer } from "@/lib/actions/user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Edit customer", robots: { index: false } };

export default async function EditCustomerPage({
  params,
}: PageProps<"/dashboard/customers/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });
  if (!customer) notFound();

  return (
    <FormShell
      title={`Edit ${customer.name}`}
      description="Correcting contact details on behalf of a customer."
      backHref={`/dashboard/customers/${customer.id}`}
      backLabel="Back to customer"
    >
      <ActionForm action={updateCustomer} className="space-y-6">
        <input type="hidden" name="id" value={customer.id} />
        <FormSection title="Account">
          <TextField label="Full name" name="name" required defaultValue={customer.name} />
          <TextField
            label="Email address"
            name="email"
            type="email"
            required
            defaultValue={customer.email}
          />
          <TextField
            label="Mobile number"
            name="phone"
            type="tel"
            required
            defaultValue={customer.phone ?? ""}
            placeholder="01XXXXXXXXX"
          />
          <CheckboxField
            label="Active"
            name="isActive"
            defaultChecked={customer.isActive}
            hint="Deactivated accounts can't sign in."
          />
        </FormSection>
        <FormActions submitLabel="Save changes" cancelHref={`/dashboard/customers/${customer.id}`} />
      </ActionForm>
    </FormShell>
  );
}
