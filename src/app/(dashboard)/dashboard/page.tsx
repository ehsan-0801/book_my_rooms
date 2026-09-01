import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/dashboard/ui";
import { Table, TBody, TD, TH, THead, TR } from "@/components/dashboard/table";
import { TableScroll } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";
import { bdt, formatDateLong } from "@/lib/format";
import {
  getAdminOverview,
  getCustomerOverview,
  getVendorOverview,
} from "@/lib/queries/overview";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") return <AdminOverview name={user.name ?? "Admin"} />;
  if (user.role === "VENDOR") {
    return user.vendorId ? (
      <VendorOverview vendorId={user.vendorId} name={user.name ?? "Vendor"} />
    ) : (
      <VendorPending />
    );
  }
  return <CustomerOverview userId={user.id} name={user.name ?? "there"} />;
}

/* ------------------------------------------------------------------ admin */

async function AdminOverview({ name }: { name: string }) {
  const d = await getAdminOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        description="Marketplace health across all vendors, properties and bookings."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross booking value"
          value={bdt(d.gmv)}
          icon="TrendingUp"
          delta={d.gmvDelta}
        />
        <StatCard
          label="Platform commission"
          value={bdt(d.commission30)}
          icon="Percent"
          hint="Earned in the last 30 days"
        />
        <StatCard
          label="Bookings"
          value={d.bookings30.toLocaleString("en-BD")}
          icon="CalendarCheck"
          delta={d.bookingsDelta}
        />
        <StatCard
          label="Customers"
          value={d.customersTotal.toLocaleString("en-BD")}
          icon="Users"
          hint="Registered travellers"
        />
      </div>

      {/* Queues that need an admin decision */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Vendors awaiting approval"
          value={String(d.vendorsPending)}
          icon="Store"
          hint={`${d.vendorsTotal} vendors total`}
          href="/dashboard/vendors?status=PENDING"
        />
        <StatCard
          label="Properties to review"
          value={String(d.propertiesPending)}
          icon="Building2"
          hint={`${d.propertiesPublished} published`}
          href="/dashboard/properties?status=PENDING_REVIEW"
        />
        <StatCard
          label="Reviews to moderate"
          value={String(d.reviewsPending)}
          icon="MessageSquareText"
          hint="Hidden until approved"
          href="/dashboard/reviews?status=pending"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent bookings</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/dashboard/bookings">
                View all <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
          <TableScroll>
            <Table>
              <THead>
                <tr>
                  <TH>Reference</TH>
                  <TH>Guest</TH>
                  <TH>Property</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                </tr>
              </THead>
              <TBody>
                {d.recentBookings.map((b) => (
                  <TR key={b.id}>
                    <TD className="font-mono text-xs whitespace-nowrap">{b.reference}</TD>
                    <TD className="whitespace-nowrap">{b.guestName}</TD>
                    <TD className="max-w-48 truncate">{b.property.name}</TD>
                    <TD><StatusBadge status={b.status} /></TD>
                    <TD className="text-right font-medium tabular-nums whitespace-nowrap">
                      {bdt(Number(b.grandTotal))}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Vendor applications</h2>
          {d.pendingVendors.length === 0 ? (
            <EmptyState icon="CheckCheck" title="No pending applications" />
          ) : (
            <ul className="space-y-3">
              {d.pendingVendors.map((v) => (
                <li key={v.id} className="rounded-xl border bg-card p-4">
                  <p className="font-medium">{v.businessName}</p>
                  <p className="truncate text-xs text-muted-foreground">{v.contactEmail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied {formatDateLong(v.createdAt)}
                  </p>
                  <Button asChild size="sm" className="mt-3 w-full">
                    <Link href="/dashboard/vendors?status=PENDING">Review</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- vendor */

async function VendorOverview({ vendorId, name }: { vendorId: string; name: string }) {
  const d = await getVendorOverview(vendorId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${name.split(" ")[0]}`}
        description="How your properties are performing over the last 30 days."
        action={
          <Button asChild>
            <Link href="/dashboard/properties">Manage properties</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={bdt(d.revenue30)}
          icon="TrendingUp"
          delta={d.revenueDelta}
        />
        <StatCard
          label="Net earnings"
          value={bdt(d.netEarnings)}
          icon="Wallet"
          hint={`After ${bdt(d.commissionPaid)} commission`}
        />
        <StatCard
          label="Bookings"
          value={String(d.bookings30)}
          icon="CalendarCheck"
          delta={d.bookingsDelta}
        />
        <StatCard
          label="Guest rating"
          value={d.ratingAvg ? d.ratingAvg.toFixed(1) : "—"}
          icon="Star"
          hint={`${d.ratingCount.toLocaleString("en-BD")} reviews`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Properties" value={String(d.properties)} icon="Building2" href="/dashboard/properties" />
        <StatCard label="Room types" value={String(d.rooms)} icon="BedDouble" href="/dashboard/rooms" />
        <StatCard label="Upcoming stays" value={String(d.upcoming)} icon="CalendarRange" href="/dashboard/bookings" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent bookings</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/bookings">
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
        {d.recentBookings.length === 0 ? (
          <EmptyState
            icon="CalendarX"
            title="No bookings yet"
            body="Once your rooms are live and bookable, reservations appear here."
          />
        ) : (
          <TableScroll>
            <Table>
              <THead>
                <tr>
                  <TH>Reference</TH>
                  <TH>Guest</TH>
                  <TH>Stay</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Total</TH>
                </tr>
              </THead>
              <TBody>
                {d.recentBookings.map((b) => (
                  <TR key={b.id}>
                    <TD className="font-mono text-xs whitespace-nowrap">{b.reference}</TD>
                    <TD className="whitespace-nowrap">{b.guestName}</TD>
                    <TD className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateLong(b.checkIn)} → {formatDateLong(b.checkOut)}
                    </TD>
                    <TD><StatusBadge status={b.status} /></TD>
                    <TD className="text-right font-medium tabular-nums whitespace-nowrap">
                      {bdt(Number(b.grandTotal))}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
      </section>
    </div>
  );
}

function VendorPending() {
  return (
    <EmptyState
      icon="Clock"
      title="Your vendor account is awaiting approval"
      body="An administrator is reviewing your business details. You'll be able to add properties and rooms as soon as you're approved — usually within two working days."
      action={
        <Button asChild variant="outline">
          <Link href="/">Back to the storefront</Link>
        </Button>
      }
    />
  );
}

/* --------------------------------------------------------------- customer */

async function CustomerOverview({ userId, name }: { userId: string; name: string }) {
  const d = await getCustomerOverview(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${name.split(" ")[0]}`}
        description="Your trips, saved stays and reviews in one place."
        action={
          <Button asChild>
            <Link href="/properties">Find a stay</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming trips" value={String(d.upcoming)} icon="CalendarRange" href="/dashboard/bookings" />
        <StatCard label="Completed stays" value={String(d.past)} icon="CheckCheck" />
        <StatCard label="Saved properties" value={String(d.wishlist)} icon="Heart" href="/dashboard/wishlist" />
        <StatCard label="Total spent" value={bdt(d.totalSpend)} icon="Wallet" hint="Across all bookings" />
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">Your next trip</h2>
        {d.nextTrip ? (
          <article className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:p-5">
            {d.nextTrip.property.images[0] ? (
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-auto sm:h-32 sm:w-44">
                <Image
                  src={d.nextTrip.property.images[0].url}
                  alt={d.nextTrip.property.images[0].alt ?? ""}
                  fill
                  sizes="(max-width: 640px) 100vw, 11rem"
                  className="object-cover"
                />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={d.nextTrip.status} />
                <span className="font-mono text-xs text-muted-foreground">
                  {d.nextTrip.reference}
                </span>
              </div>
              <h3 className="mt-1.5 text-lg font-semibold">
                <Link
                  href={`/properties/${d.nextTrip.property.district.slug}/${d.nextTrip.property.slug}`}
                  className="hover:underline"
                >
                  {d.nextTrip.property.name}
                </Link>
              </h3>
              <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {d.nextTrip.property.addressLine}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm">
                <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
                {formatDateLong(d.nextTrip.checkIn)} → {formatDateLong(d.nextTrip.checkOut)}
                <span className="text-muted-foreground">
                  · {d.nextTrip.nights} night{d.nextTrip.nights === 1 ? "" : "s"}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 flex-col justify-between gap-3 sm:items-end">
              <div className="sm:text-right">
                <p className="text-lg font-bold text-price">
                  {bdt(Number(d.nextTrip.grandTotal))}
                </p>
                <p className="text-xs text-muted-foreground">total</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/bookings">Booking details</Link>
              </Button>
            </div>
          </article>
        ) : (
          <EmptyState
            icon="Compass"
            title="No trips booked yet"
            body="When you book a stay it'll show up here with your confirmation and invoice."
            action={
              <Button asChild>
                <Link href="/properties">Browse stays</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
