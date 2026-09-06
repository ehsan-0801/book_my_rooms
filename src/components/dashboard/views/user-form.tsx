"use client";

import { useState } from "react";

import { ActionForm } from "@/components/dashboard/action-form";
import {
  CheckboxField,
  FormActions,
  FormSection,
  FormShell,
  SelectField,
  TextField,
} from "@/components/dashboard/form";
import type { ActionResult } from "@/lib/actions/result";

export interface UserFormData {
  id?: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  hasVendor?: boolean;
}

const ROLES = [
  { value: "CUSTOMER", label: "Traveller — books stays" },
  { value: "VENDOR", label: "Vendor — lists properties" },
  { value: "ADMIN", label: "Administrator — full access" },
];

/**
 * Shared by the create and edit pages.
 *
 * Role is a live control rather than a plain select: choosing Vendor on a new
 * account reveals the business name, because a vendor is a business that has
 * to be approved, not just a login.
 */
export function UserForm({
  action,
  user,
  title,
  description,
  submitLabel,
  backHref = "/dashboard/users",
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  user?: UserFormData;
  title: string;
  description: string;
  submitLabel: string;
  backHref?: string;
}) {
  const [role, setRole] = useState(user?.role ?? "CUSTOMER");
  const isNew = !user?.id;

  return (
    <FormShell title={title} description={description} backHref={backHref} backLabel="Back to users">
      <ActionForm action={action} className="space-y-6">
        {user?.id ? <input type="hidden" name="id" value={user.id} /> : null}

        <FormSection title="Account" description="How this person signs in and is identified.">
          <TextField label="Full name" name="name" required defaultValue={user?.name ?? ""} />
          <TextField
            label="Email address"
            name="email"
            type="email"
            required
            defaultValue={user?.email ?? ""}
          />
          <TextField
            label="Mobile number"
            name="phone"
            type="tel"
            required
            defaultValue={user?.phone ?? ""}
            placeholder="01XXXXXXXXX"
          />
          {/* SelectField renders a native select and takes no onChange, so the
              role is observed from the change event as it bubbles. */}
          <div
            onChange={(e) => {
              const target = e.target as HTMLElement;
              if (target instanceof HTMLSelectElement) setRole(target.value);
            }}
          >
            <SelectField
              label="Role"
              name="role"
              required
              options={ROLES}
              defaultValue={user?.role ?? "CUSTOMER"}
              hint={
                user && user.role === "VENDOR"
                  ? "Changing a vendor's role leaves their business profile in place."
                  : "Administrators can manage everything, including other users."
              }
            />
          </div>
          <CheckboxField
            label="Active"
            name="isActive"
            defaultChecked={user?.isActive ?? true}
            hint="Deactivated accounts can't sign in."
          />
        </FormSection>

        {isNew && role === "VENDOR" ? (
          <FormSection
            title="Business"
            description="The vendor starts as pending — approve them from the Vendors page."
          >
            <TextField label="Business name" name="businessName" required />
          </FormSection>
        ) : null}

        {isNew ? (
          <FormSection title="Password" description="Share this with the user so they can sign in.">
            <TextField
              label="Password"
              name="password"
              type="password"
              required
              hint="At least 8 characters."
            />
          </FormSection>
        ) : null}

        <FormActions submitLabel={submitLabel} cancelHref={backHref} />
      </ActionForm>
    </FormShell>
  );
}
