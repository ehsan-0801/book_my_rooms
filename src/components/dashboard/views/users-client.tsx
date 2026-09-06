"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Plus } from "lucide-react";

import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DeleteDialog } from "@/components/dashboard/delete-dialog";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteUser, setUserActive } from "@/lib/actions/user";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";
import { formatDateLong } from "@/lib/format";

type ViewData = ResourceData<"users">;
type Row = ViewData["users"][number];

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-primary text-primary-foreground",
  VENDOR: "bg-info text-white",
  CUSTOMER: "bg-secondary text-secondary-foreground",
};
const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  VENDOR: "Vendor",
  CUSTOMER: "Traveller",
};
const FILTERS = ["ALL", "ADMIN", "VENDOR", "CUSTOMER"] as const;

export function UsersClient() {
  const [role, setRole] = useState<(typeof FILTERS)[number]>("ALL");
  const [query, setQuery] = useState("");

  const params = new URLSearchParams();
  if (role !== "ALL") params.set("role", role);
  if (query.trim()) params.set("q", query.trim());
  const qs = params.toString();

  const { data, loading } = useApi<ViewData>(
    `/api/dashboard/users${qs ? `?${qs}` : ""}`,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Every account on the platform — administrators, vendors and travellers."
        action={
          <Button asChild>
            <Link href="/dashboard/users/new">
              <Plus className="size-4" aria-hidden />
              Add user
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or mobile"
          className="sm:max-w-xs"
          aria-label="Search users"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={role === f ? "default" : "outline"}
              onClick={() => setRole(f)}
            >
              {f === "ALL" ? "All" : ROLE_LABEL[f]}
              {data && f !== "ALL" ? (
                <span className="ml-1 tabular-nums opacity-70">{data.counts[f] ?? 0}</span>
              ) : null}
            </Button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <TableSkeleton rows={7} columns={6} />
      ) : (
        <UsersTable users={data.users} />
      )}
    </div>
  );
}

function UsersTable({ users }: { users: Row[] }) {
  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "User",
      mobile: "title",
      cell: (u) => (
        <div className="min-w-0">
          <span className="block max-w-52 truncate font-medium">{u.name}</span>
          <span className="block max-w-52 truncate text-xs text-muted-foreground">
            {u.email}
          </span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      mobile: "meta",
      cell: (u) => (
        <div className="flex flex-col gap-1">
          <Badge className={ROLE_STYLE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
          {u.vendor ? (
            <span className="max-w-40 truncate text-xs text-muted-foreground">
              {u.vendor.businessName}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      mobile: "body",
      cell: (u) => <span className="text-xs whitespace-nowrap">{u.phone ?? "—"}</span>,
    },
    {
      key: "activity",
      header: "Activity",
      mobile: "body",
      cell: (u) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {u._count.bookings} booking{u._count.bookings === 1 ? "" : "s"} ·{" "}
          {u._count.reviews} review{u._count.reviews === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      mobile: "body",
      cell: (u) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDateLong(u.createdAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobile: "meta",
      cell: (u) => (
        <Badge className={u.isActive ? "bg-success text-white" : "bg-destructive text-white"}>
          {u.isActive ? "Active" : "Deactivated"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      mobile: "footer",
      cell: (u) => (
        <div className="flex flex-wrap justify-end gap-1 md:flex-nowrap">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/users/${u.id}`}>
              <Eye className="size-3.5" aria-hidden />
              View
            </Link>
          </Button>
          <ActionForm action={setUserActive}>
            <input type="hidden" name="id" value={u.id} />
            <input type="hidden" name="active" value={u.isActive ? "false" : "true"} />
            <SubmitButton size="sm" variant="ghost">
              {u.isActive ? "Deactivate" : "Reactivate"}
            </SubmitButton>
          </ActionForm>
          <DeleteDialog
            action={deleteUser}
            id={u.id}
            title={`Delete ${u.name}`}
            description="Accounts with bookings, or vendors still holding properties, can't be deleted — deactivate them instead so the records stay intact."
            iconOnly
          />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey={(u) => u.id}
      caption="Users"
      empty={<EmptyState icon="Users" title="No users match that search" />}
    />
  );
}
