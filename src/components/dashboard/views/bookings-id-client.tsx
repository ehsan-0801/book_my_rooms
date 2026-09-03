"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";

import { PageHeader, StatusBadge } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ActionForm, SubmitButton } from "@/components/dashboard/action-form";
import { bdt, formatDateLong } from "@/lib/format";
import { setBookingStatus } from "@/lib/actions/vendor";
import { requestCancellation } from "@/lib/actions/customer";

import { notFound } from "next/navigation";
import { FormSkeleton } from "@/components/dashboard/skeletons";
import { useApi } from "@/lib/api/client";
import type { ResourceData } from "@/lib/api/dashboard";

type ViewData = ResourceData<"bookings/detail">;

export function BookingDetailClient({ id }: { id: string }) {
  const { data, loading, error } = useApi<ViewData>(`/api/dashboard/bookings/detail/${id}`);

  if (error?.status === 404) notFound();
  if (loading || !data) return <FormSkeleton sections={3} />;

  return <BookingDetailView data={data} />;
}

function BookingDetailView({ data }: { data: ViewData }) {
  const booking = data.booking;
  const isCustomer = data.role === "CUSTOMER";
  const canManage = data.role === "ADMIN" || data.role === "VENDOR";

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link href="/dashboard/bookings">
            <ArrowLeft className="size-4" aria-hidden />
            Back to bookings
          </Link>
        </Button>
      </div>

      <PageHeader
        title={booking.reference}
        description={`Booked ${formatDateLong(booking.createdAt)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={booking.status} />
            <StatusBadge status={booking.paymentStatus} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Property */}
          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-col gap-4 p-5 sm:flex-row">
              {booking.property.images[0] ? (
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-auto sm:h-28 sm:w-40">
                  <Image
                    src={booking.property.images[0].url}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 10rem"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">
                  <Link
                    href={`/properties/${booking.property.district.slug}/${booking.property.slug}`}
                    target="_blank"
                    className="hover:underline"
                  >
                    {booking.property.name}
                  </Link>
                </h2>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {booking.property.addressLine}
                </p>
                {!isCustomer ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Vendor: {booking.property.vendor.businessName}
                  </p>
                ) : null}
              </div>
            </div>

            <Separator />

            <dl className="grid gap-5 p-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Check-in</dt>
                <dd className="text-sm font-medium">{formatDateLong(booking.checkIn)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Check-out</dt>
                <dd className="text-sm font-medium">{formatDateLong(booking.checkOut)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Guests</dt>
                <dd className="text-sm font-medium">
                  {booking.adults} adult{booking.adults === 1 ? "" : "s"}
                  {booking.children ? `, ${booking.children} children` : ""}
                </dd>
              </div>
            </dl>
          </section>

          {/* Rooms */}
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Rooms</h2>
            <ul className="mt-3 divide-y">
              {booking.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.roomName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.units} room{item.units === 1 ? "" : "s"} × {item.nights} night
                      {item.nights === 1 ? "" : "s"} @ {bdt(Number(item.unitPrice))}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    {bdt(Number(item.lineTotal))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Guest */}
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Guest details</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="text-sm font-medium">{booking.guestName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Account</dt>
                <dd className="text-sm">{booking.user?.email ?? "Guest checkout"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="text-sm">
                  <a href={`mailto:${booking.guestEmail}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <Mail className="size-3.5" aria-hidden />
                    {booking.guestEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="text-sm">
                  <a href={`tel:${booking.guestPhone}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <Phone className="size-3.5" aria-hidden />
                    {booking.guestPhone}
                  </a>
                </dd>
              </div>
              {booking.specialRequest ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Special request</dt>
                  <dd className="text-sm">{booking.specialRequest}</dd>
                </div>
              ) : null}
              {booking.cancelReason ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Cancellation reason</dt>
                  <dd className="text-sm">{booking.cancelReason}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        {/* Money */}
        <aside className="space-y-4">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Payment</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{bdt(Number(booking.subtotal))}</dd>
              </div>
              {Number(booking.discountTotal) > 0 ? (
                <div className="flex justify-between gap-4 text-offer">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{bdt(Number(booking.discountTotal))}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Taxes &amp; fees</dt>
                <dd className="tabular-nums">{bdt(Number(booking.taxTotal))}</dd>
              </div>
              <Separator />
              <div className="flex justify-between gap-4 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{bdt(Number(booking.grandTotal))}</dd>
              </div>
            </dl>

            {booking.invoice ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Invoice {booking.invoice.invoiceNumber}
              </p>
            ) : null}
          </section>

          {booking.payments.length > 0 ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-semibold">Transactions</h2>
              <ul className="mt-3 space-y-3">
                {booking.payments.map((p) => (
                  <li key={p.id} className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{p.method}</span>
                      <span className="tabular-nums">{bdt(Number(p.amount))}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <StatusBadge status={p.status} />
                      {p.gatewayRef ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {p.gatewayRef}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {canManage && booking.commission ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-semibold">Commission</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Rate ({Number(booking.commission.rate)}%)
                  </dt>
                  <dd className="tabular-nums">{bdt(Number(booking.commission.amount))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Vendor payout</dt>
                  <dd className="tabular-nums">
                    {bdt(Number(booking.commission.vendorPayout))}
                  </dd>
                </div>
                <div className="pt-1">
                  <StatusBadge status={booking.commission.status} />
                </div>
              </dl>
            </section>
          ) : null}

          {booking.refunds.length > 0 ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-semibold">Refunds</h2>
              <ul className="mt-3 space-y-3">
                {booking.refunds.map((r) => (
                  <li key={r.id} className="text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge status={r.status} />
                      <span className="tabular-nums">{bdt(Number(r.amount))}</span>
                    </div>
                    {r.reason ? (
                      <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Actions */}
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold">Actions</h2>
            <div className="mt-3 flex flex-col gap-2">
              {canManage ? (
                <>
                  {["PENDING", "PAYMENT_PENDING"].includes(booking.status) ? (
                    <ActionForm action={setBookingStatus}>
                      <input type="hidden" name="id" value={booking.id} />
                      <input type="hidden" name="status" value="CONFIRMED" />
                      <SubmitButton className="w-full">Confirm booking</SubmitButton>
                    </ActionForm>
                  ) : null}
                  {booking.status === "CONFIRMED" ? (
                    <ActionForm action={setBookingStatus}>
                      <input type="hidden" name="id" value={booking.id} />
                      <input type="hidden" name="status" value="COMPLETED" />
                      <SubmitButton variant="outline" className="w-full">
                        Mark as checked out
                      </SubmitButton>
                    </ActionForm>
                  ) : null}
                  {["PENDING", "PAYMENT_PENDING", "CONFIRMED"].includes(booking.status) ? (
                    <ActionForm action={setBookingStatus}>
                      <input type="hidden" name="id" value={booking.id} />
                      <input type="hidden" name="status" value="CANCELLED" />
                      <SubmitButton
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                      >
                        Cancel booking
                      </SubmitButton>
                    </ActionForm>
                  ) : null}
                </>
              ) : ["PENDING", "PAYMENT_PENDING", "CONFIRMED"].includes(booking.status) ? (
                <ActionForm action={requestCancellation}>
                  <input type="hidden" name="id" value={booking.id} />
                  <SubmitButton
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                  >
                    Request cancellation
                  </SubmitButton>
                </ActionForm>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This booking is closed — no further actions are available.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

