"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { FormSection, TextField } from "@/components/dashboard/form";
import { DetailSkeleton } from "@/components/dashboard/skeletons";
import { PageHeader } from "@/components/dashboard/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteUser, resetUserPassword, setUserActive } from "@/lib/actions/user";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";
import { formatDateLong } from "@/lib/format";

type ViewData = ResourceData<"users/detail">;

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  VENDOR: "Vendor",
  CUSTOMER: "Traveller",
};

export function UserDetailClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/users/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <DetailSkeleton />;

  const rows: [string, React.ReactNode][] = [
    ["Email", data.email],
    ["Mobile", data.phone ?? "—"],
    ["Role", ROLE_LABEL[data.role] ?? data.role],
    ["Status", data.isActive ? "Active" : "Deactivated"],
    ["Email verified", data.emailVerified ? formatDateLong(data.emailVerified) : "Not verified"],
    ["Joined", formatDateLong(data.createdAt)],
    ["Bookings", data._count.bookings],
    ["Reviews", data._count.reviews],
    ["Wishlist", data._count.wishlist],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        description={`${ROLE_LABEL[data.role] ?? data.role} · joined ${formatDateLong(data.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/users/${data.id}/edit`}>
                <Pencil className="size-4" aria-hidden />
                Edit
              </Link>
            </Button>
            <ActionForm action={setUserActive}>
              <input type="hidden" name="id" value={data.id} />
              <input type="hidden" name="active" value={data.isActive ? "false" : "true"} />
              <SubmitButton variant="outline">
                {data.isActive ? "Deactivate" : "Reactivate"}
              </SubmitButton>
            </ActionForm>
            <DeleteDialog
              action={deleteUser}
              id={data.id}
              title={`Delete ${data.name}`}
              description="Accounts with bookings, or vendors still holding properties, can't be deleted — deactivate them instead."
              redirectTo="/dashboard/users"
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 sm:block">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            {data.vendor ? (
              <div className="mt-5 rounded-lg border bg-secondary/30 p-4">
                <p className="text-xs text-muted-foreground">Vendor business</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/vendors/${data.vendor.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {data.vendor.businessName}
                  </Link>
                  <Badge variant="outline">{data.vendor.status}</Badge>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reset password</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-xs text-muted-foreground">
              Sets a new password immediately. Share it with {data.name} directly — it
              isn&apos;t emailed.
            </p>
            <ActionForm action={resetUserPassword} className="space-y-4">
              <input type="hidden" name="id" value={data.id} />
              <FormSection title="New credentials">
                <TextField
                  label="New password"
                  name="newPassword"
                  type="password"
                  required
                  full
                  hint="At least 8 characters."
                />
                <TextField
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  required
                  full
                />
              </FormSection>
              <SubmitButton variant="outline" className="w-full">
                Reset password
              </SubmitButton>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
