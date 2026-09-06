"use client";

import { notFound } from "next/navigation";

import { FormSkeleton } from "@/components/dashboard/skeletons";
import { UserForm } from "@/components/dashboard/views/user-form";
import { updateUser } from "@/lib/actions/user";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"users/detail">;

export function EditUserClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/users/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return (
    <UserForm
      action={updateUser}
      user={{
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isActive: data.isActive,
        hasVendor: Boolean(data.vendor),
      }}
      title={`Edit ${data.name}`}
      description="Update this account's details, role or access."
      submitLabel="Save changes"
      backHref={`/dashboard/users/${data.id}`}
    />
  );
}
