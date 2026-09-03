import type { Metadata } from "next";

import { BookingDetailClient } from "@/components/dashboard/views/bookings-id-client";

export const metadata: Metadata = { title: "Booking", robots: { index: false } };

/** Server shell: emits metadata; the form renders client-side. */
export default async function BookingDetailPage({
  params,
}: PageProps<"/dashboard/bookings/[id]">) {
  const { id } = await params;
  return <BookingDetailClient id={id} />;
}
