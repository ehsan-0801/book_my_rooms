"use client";

import { UserForm } from "@/components/dashboard/views/user-form";
import { createUser } from "@/lib/actions/user";

export function NewUserClient() {
  return (
    <UserForm
      action={createUser}
      title="Add user"
      description="Create an account on behalf of someone — a colleague, a vendor, or a traveller."
      submitLabel="Create user"
    />
  );
}
