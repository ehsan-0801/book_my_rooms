"use client";

import { ActionForm } from "@/components/dashboard/action-form";
import {
  CheckboxField,
  FormActions,
  FormSection,
  FormShell,
  TextField,
} from "@/components/dashboard/form";
import { updateCustomer } from "@/lib/actions/user";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"customers/detail">;

export function EditCustomerClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/customers/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <EditCustomerView data={data} />;
}

function EditCustomerView({ data }: { data: ViewData }) {
  const customer = data.customer;

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

