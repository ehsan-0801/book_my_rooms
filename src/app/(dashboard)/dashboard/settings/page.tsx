import type { Metadata } from "next";

import {
  FormSection,
  TextField,
} from "@/components/dashboard/form";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  changeOwnPassword,
  updateOwnProfile,
  updateVendorProfile,
} from "@/lib/actions/user";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const session = await requireUser();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: {
      id: true, name: true, email: true, phone: true, avatarUrl: true, role: true,
      vendor: {
        select: {
          id: true, businessName: true, contactEmail: true, contactPhone: true,
          address: true, tradeLicenseNo: true, tinNumber: true, bankName: true,
          bankAccountName: true, bankAccountNo: true, status: true, commissionRate: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile, security and — for vendors — business details."
      />

      {/* Profile */}
      <form action={updateOwnProfile} className="space-y-4">
        <FormSection title="Profile" description="How you appear across the platform.">
          <TextField label="Full name" name="name" required defaultValue={user.name} />
          <TextField
            label="Mobile number"
            name="phone"
            type="tel"
            required
            defaultValue={user.phone ?? ""}
            placeholder="01XXXXXXXXX"
          />
          <div className="sm:col-span-2">
            <Label className="mb-2 block">Profile photo</Label>
            <ImageUploader
              kind="avatars"
              max={1}
              value={
                user.avatarUrl
                  ? [{ url: user.avatarUrl, publicId: "", width: 0, height: 0 }]
                  : []
              }
            />
            <input type="hidden" name="avatarUrl" defaultValue={user.avatarUrl ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Label>Email address</Label>
            <Input value={user.email} disabled readOnly className="mt-1.5" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your sign-in email can&rsquo;t be changed here — contact support.
            </p>
          </div>
        </FormSection>
        <div className="flex justify-end">
          <Button type="submit">Save profile</Button>
        </div>
      </form>

      {/* Vendor business details */}
      {user.vendor ? (
        <form action={updateVendorProfile} className="space-y-4">
          <FormSection
            title="Business details"
            description="Used on invoices and for settling your payouts."
          >
            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-secondary/50 p-3">
                <StatusBadge status={user.vendor.status} />
                <span className="text-sm text-muted-foreground">
                  Commission rate: {Number(user.vendor.commissionRate ?? 15)}% — set by
                  the platform.
                </span>
              </div>
            </div>

            <TextField
              label="Business name"
              name="businessName"
              required
              defaultValue={user.vendor.businessName}
            />
            <TextField
              label="Contact email"
              name="contactEmail"
              type="email"
              required
              defaultValue={user.vendor.contactEmail}
            />
            <TextField
              label="Contact phone"
              name="contactPhone"
              type="tel"
              required
              defaultValue={user.vendor.contactPhone}
            />
            <TextField
              label="Business address"
              name="address"
              defaultValue={user.vendor.address ?? ""}
            />
            <TextField
              label="Trade licence number"
              name="tradeLicenseNo"
              defaultValue={user.vendor.tradeLicenseNo ?? ""}
            />
            <TextField
              label="TIN"
              name="tinNumber"
              defaultValue={user.vendor.tinNumber ?? ""}
            />
            <TextField
              label="Bank name"
              name="bankName"
              defaultValue={user.vendor.bankName ?? ""}
            />
            <TextField
              label="Account name"
              name="bankAccountName"
              defaultValue={user.vendor.bankAccountName ?? ""}
            />
            <TextField
              label="Account number"
              name="bankAccountNo"
              defaultValue={user.vendor.bankAccountNo ?? ""}
            />
          </FormSection>
          <div className="flex justify-end">
            <Button type="submit">Save business details</Button>
          </div>
        </form>
      ) : null}

      {/* Password */}
      <form action={changeOwnPassword} className="space-y-4">
        <FormSection
          title="Password"
          description="Use at least 8 characters, with a letter and a number."
        >
          <TextField
            label="Current password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            full
          />
          <TextField
            label="New password"
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
          />
          <TextField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
          />
        </FormSection>
        <div className="flex justify-end">
          <Button type="submit">Change password</Button>
        </div>
      </form>
    </div>
  );
}
